import { supabase } from '../../database/connection.js';
import { hashPassword, comparePassword } from '../../../shared/utils/bcrypt.js';
import { generateToken } from '../../../shared/utils/jwt.js';
import { v4 as uuidv4 } from 'uuid';

export const checkNicknameAvailability = async (req, res) => {
    const { nickname } = req.body;

    if (!nickname || nickname.length < 3 || nickname.includes(' ')) {
        return res.status(400).json({ available: false, message: 'Nickname inválido.' });
    }

    try {
        const { data: existingUser, error } = await supabase
            .from('users')
            .select('id')
            .eq('nickname', nickname)
            .maybeSingle();

        if (error) throw error;

        if (existingUser) {
            return res.status(200).json({ available: false, message: 'Este nickname ya está en uso.' });
        } else {
            return res.status(200).json({ available: true });
        }
    } catch (err) {
        console.error("Error checking nickname:", err.message);
        res.status(500).json({ available: false, message: 'Error al verificar el nickname.' });
    }
};

export const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const hashedPassword = await hashPassword(password);
        const tempNickname = `user_${uuidv4().substring(0, 8)}`;

        const { data, error } = await supabase
            .from('users')
            .insert([{
                email: email,
                password: hashedPassword,
                nickname: tempNickname
            }])
            .select('id, email, created_at, nickname, is_admin')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Este email ya está registrado' });
            }
            throw error;
        }

        const tokenPayload = {
            userId: data.id,
            email: data.email,
            isAdmin: data.is_admin || false
        };
        const token = generateToken(tokenPayload);

        res.status(201).json({
            message: 'Usuario registrado.',
            token: token,
            onboardingRequired: true,
            user: data
        });
    } catch (err) {
        console.error("Error in registerUser:", err.message);
        res.status(500).json({ error: err.message || 'Error al registrar el usuario' });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*, is_admin, is_producer')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const tokenPayload = {
            userId: user.id,
            email: user.email,
            isAdmin: user.is_admin || false,
            nickname: user.nickname,
            is_producer: user.is_producer || false
        };

        const token = generateToken(tokenPayload);

        const userResponse = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            isAdmin: user.is_admin || false,
            nickname: user.nickname,
            is_producer: user.is_producer || false
        };

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token: token,
            user: userResponse
        });
    } catch (err) {
        console.error("Error in loginUser:", err.message);
        res.status(500).json({ error: err.message || 'Error en el servidor durante el login.' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { currentPassword, newPassword } = req.body;

        console.log(`[changePassword] Intentando para userId: ${userId}`);

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password, email')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            console.error(`[changePassword] Usuario no encontrado o error:`, fetchError);
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (user.password) {
            const isPasswordValid = await comparePassword(currentPassword, user.password);
            if (!isPasswordValid) {
                console.warn(`[changePassword] Contraseña actual incorrecta para: ${user.email}`);
                return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
            }
        } else {
            console.warn(`[changePassword] El usuario ${user.email} no tiene contraseña en la tabla users. Saltando verificación local.`);
        }

        // 2. Actualizar en Supabase Auth (Management)
        console.log(`[changePassword] Actualizando Supabase Auth para: ${userId}`);
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (authUpdateError) {
            console.error(`[changePassword] Error actualizando Supabase Auth:`, authUpdateError);
            // Si es un error de "password too short" u otro, lo mandamos al front
            return res.status(400).json({ error: authUpdateError.message });
        }

        // 3. Actualizar en nuestra tabla local
        console.log(`[changePassword] Actualizando tabla local para: ${userId}`);
        const hashedPassword = await hashPassword(newPassword);
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword, updated_at: new Date() })
            .eq('id', userId);

        if (updateError) throw updateError;

        console.log(`[changePassword] Éxito para: ${user.email}`);
        res.status(200).json({ message: 'Contraseña actualizada con éxito' });
    } catch (err) {
        console.error("Error in changePassword:", err.message);
        res.status(500).json({ error: 'Error interno al cambiar la contraseña' });
    }
};
