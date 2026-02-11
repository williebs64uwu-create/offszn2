import bcrypt from 'bcryptjs';

const saltRounds = 10;

export const hashPassword = async (plainPassword) => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        return await bcrypt.hash(plainPassword, salt);
    } catch (error) {
        console.error("Error hashing password:", error);
        throw new Error("Internal error processing password.");
    }
};

export const comparePassword = async (plainPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        console.error("Error comparing passwords:", error);
        return false;
    }
};
