import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../api/client';
import toast from 'react-hot-toast';

export const useCartStore = create()(
  persist(
    (set, get) => ({
      items: [], // Named 'items' for consistency with hybrid logic
      loading: false,
      isOpen: false,

      // UI Actions
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      // Initial load / Sync with Supabase if logged in
      syncWithSupabase: async (userId) => {
        if (!userId) return;
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from('cart_items')
            .select(`
              id,
              product_id,
              license_id,
              products (
                id,
                name,
                price_basic,
                image_url,
                cover_url,
                producer_id,
                profiles:producer_id (nickname)
              )
            `)
            .eq('user_id', userId);

          if (error) throw error;

          const formattedItems = data.map(item => ({
            id: item.id,
            productId: item.product_id,
            licenseId: item.license_id,
            name: item.products.name,
            image: item.products.cover_url || item.products.image_url,
            price: item.products.price_basic,
            producer: item.products.profiles?.nickname || 'Producer',
            producerId: item.products.producer_id
          }));

          set({ items: formattedItems });
        } catch (error) {
          console.error('Error syncing cart:', error);
        } finally {
          set({ loading: false });
        }
      },

      // Add item (Alias: addToCart for compatibility)
      addItem: async (product, licenseId = 'basic', userId = null) => {
        const { items } = get();

        const exists = items.find(
          item => item.productId === product.id && item.licenseId === licenseId
        );

        if (exists) {
          toast.error('Este producto ya está en tu carrito');
          set({ isOpen: true });
          return;
        }

        const newItem = {
          productId: product.id,
          licenseId,
          name: product.name,
          image: product.cover_url || product.image_url || product.products?.image_url,
          price: product.price_basic || product.products?.price_basic,
          producer: (product.profiles?.nickname || product.users?.nickname) || 'Producer',
          producerId: product.producer_id || product.products?.producer_id
        };

        if (userId) {
          try {
            const { data, error } = await supabase
              .from('cart_items')
              .insert([{
                user_id: userId,
                product_id: product.id,
                license_id: licenseId,
                variant_price: newItem.price
              }])
              .select()
              .single();

            if (error) throw error;
            set({ items: [...items, { ...newItem, id: data.id }], isOpen: true });
          } catch (error) {
            console.error('Error adding to DB cart:', error);
            return;
          }
        } else {
          set({ items: [...items, newItem], isOpen: true });
        }

        toast.success('Producto añadido al carrito');
      },
      addToCart: (product, licenseId, userId) => get().addItem(product, licenseId, userId),

      // Remove item (Alias: removeFromCart)
      removeItem: async (productId, licenseId = null, userId = null) => {
        const { items } = get();
        const itemToRemove = items.find(
          item => item.productId === productId && (licenseId ? item.licenseId === licenseId : true)
        );

        if (!itemToRemove) return;

        if (userId && itemToRemove.id) {
          try {
            const { error } = await supabase
              .from('cart_items')
              .delete()
              .eq('id', itemToRemove.id);

            if (error) throw error;
          } catch (error) {
            console.error('Error removing from DB cart:', error);
            return;
          }
        }

        set({ items: items.filter(item => item !== itemToRemove) });
        toast.success('Producto eliminado');
      },
      removeFromCart: (productId, licenseId, userId) => get().removeItem(productId, licenseId, userId),

      // Clear cart
      clearCart: async (userId = null) => {
        if (userId) {
          try {
            const { error } = await supabase
              .from('cart_items')
              .delete()
              .eq('user_id', userId);
            if (error) throw error;
          } catch (error) {
            console.error('Error clearing DB cart:', error);
          }
        }
        set({ items: [] });
      },

      // Total calculation (Alias: getCartTotal)
      getTotal: () => get().items.reduce((total, item) => total + (item.price || 0), 0),
      getCartTotal: () => get().getTotal()
    }),
    {
      name: 'offszn-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);