export const calculateCartTotals = (cartItems) => {
    let subtotal = 0;
    let serviceFee = 0; // Comisión de la plataforma
  
    const processedItems = cartItems.map(item => {
      // Usar el precio final calculado (variant_price o basic)
      const price = parseFloat(item.finalPrice || item.price_basic || 0);
      
      let commission = 0;
  
      if (price > 0) {
        if (price < 20) {
          commission = 1.00; // Flat fee para montos bajos
        } else {
          commission = price * 0.05; // 5% para el resto
        }
      }
  
      subtotal += price;
      serviceFee += commission;
  
      return {
        ...item,
        price,
        commission,
        lineTotal: price + commission
      };
    });
  
    const total = subtotal + serviceFee;
  
    return {
      items: processedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      serviceFee: parseFloat(serviceFee.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };