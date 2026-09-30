import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import BottomNav from '../../components/layout/BottomNav';
import { useCart } from '../../../../context/CartContext';
import electricianIcon from '../../../../assets/images/icons/services/electrician.png';
import womensSalonIcon from '../../../../assets/images/icons/services/womens-salon-spa-icon.png';
import massageMenIcon from '../../../../assets/images/icons/services/massage-men-icon.png';
import cleaningIcon from '../../../../assets/images/icons/services/cleaning-icon.png';
import acApplianceRepairIcon from '../../../../assets/images/icons/services/ac-appliance-repair-icon.png';
import NotificationBell from '../../components/common/NotificationBell';
import { Button, Card, EmptyState, SkeletonCard, Badge } from '../../../../components/ui';
import { gradients } from '../../../../theme';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, isLoading: loading, removeItem, removeCategoryItems } = useCart();

  const getCategoryIcon = (category) => {
    const iconMap = {
      Electrician: electricianIcon,
      Electricity: electricianIcon,
      "Women's Salon & Spa": womensSalonIcon,
      'Salon for Women': womensSalonIcon,
      'Salon Prime': womensSalonIcon,
      'Massage for Men': massageMenIcon,
      Cleaning: cleaningIcon,
      'Bathroom & Kitchen Cleaning': cleaningIcon,
      'Sofa & Carpet Cleaning': cleaningIcon,
      'AC Service and Repair': acApplianceRepairIcon,
      'AC & Appliance Repair': acApplianceRepairIcon,
    };
    return iconMap[category] || electricianIcon;
  };

  const groupedItems = useMemo(() => {
    const groups = {};
    cartItems.forEach((item) => {
      const category = item.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return groups;
  }, [cartItems]);

  const cartCount = cartItems.length;

  const handleDeleteCategory = async (category) => {
    try {
      const response = await removeCategoryItems(category);
      if (response.success) toast.success('Category items removed');
      else toast.error(response.message || 'Failed to remove category items');
    } catch {
      toast.error('Failed to remove category items');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await removeItem(itemId);
      if (response.success) toast.success('Item removed from cart');
      else toast.error(response.message || 'Failed to remove item');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleAddServices = (category) => {
    const itemsInCategory = groupedItems[category];
    const categoryId = itemsInCategory?.[0]?.categoryId;
    navigate('/user', {
      state: { openCategoryId: categoryId, openCategoryName: category },
    });
  };

  const handleCategoryCheckout = (category) => {
    navigate('/user/checkout', { state: { category } });
  };

  return (
    <div className="min-h-screen pb-32 relative bg-neutral-50" style={{ background: gradients.pageSoft }}>
      <div className="relative z-10">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-neutral-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="icon"
              icon={FiArrowLeft}
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="bg-white shadow-sm border border-neutral-100"
            />
            <div className="flex items-center gap-2">
              <FiShoppingCart className="w-5 h-5 text-primary-500" aria-hidden />
              <h1 className="text-xl font-extrabold text-neutral-900">Your Cart</h1>
              {cartCount > 0 && (
                <Badge variant="primary" size="sm">
                  {cartCount}
                </Badge>
              )}
            </div>
          </div>
          <NotificationBell />
        </header>

        <main
          className="px-4 py-4"
          style={{ paddingBottom: cartItems.length > 0 ? '70px' : '100px' }}
        >
          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : cartItems.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="Your cart is empty"
              message="Add services from the home page to get started."
              actionLabel="Browse services"
              onAction={() => navigate('/user')}
            />
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => {
                const categoryTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
                const categoryIcon = getCategoryIcon(category);
                const serviceCount = items.reduce(
                  (sum, item) => sum + (item.serviceCount || 1),
                  0
                );

                return (
                  <Card key={category} padding="md" className="!rounded-2xl">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 overflow-hidden bg-[#1a3673]/5 border border-[#1a3673]/10">
                          <img
                            src={categoryIcon}
                            alt=""
                            className="w-10 h-10 object-contain drop-shadow-sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[17px] font-black text-gray-900 mb-1 tracking-tight truncate">
                            {category}
                          </h3>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            {serviceCount} {serviceCount === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-center pr-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total</span>
                        <span className="text-[18px] font-black text-[#1a3673] leading-none">₹{categoryTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="mb-5 space-y-3 pt-2">
                      {items.map((item) => (
                        <div
                          key={item._id || item.id}
                          className="flex items-start justify-between py-2.5 border-b border-neutral-100 last:border-0"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-[15px] text-gray-900 font-bold mb-0.5">
                              {item.title} 
                            </p>
                            {item.description && (
                              <p className="text-xs font-medium text-gray-500 line-clamp-1">{item.description}</p>
                            )}
                            <span className="inline-block mt-1.5 text-[10px] font-black px-2 py-0.5 rounded border border-[#1a3673]/20 text-[#1a3673] bg-[#1a3673]/5">
                              QTY: {item.serviceCount || 1}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-[15px] font-black text-gray-900">
                              ₹{(item.price || 0).toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(item._id || item.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                              aria-label="Remove item"
                            >
                              <FiTrash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => handleAddServices(category)}
                        className="flex-1 py-3.5 rounded-[16px] font-bold text-[14px] text-[#1a3673] bg-[#1a3673]/5 border border-[#1a3673]/20 active:scale-95 transition-all"
                      >
                        + Add More
                      </button>
                      <button
                        onClick={() => handleCategoryCheckout(category)}
                        className="flex-1 py-3.5 rounded-[16px] font-bold text-[14px] text-white bg-[#1a3673] hover:bg-[#122652] active:scale-95 transition-all shadow-[0_8px_20px_rgba(26,54,115,0.2)]"
                      >
                        Checkout 
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default Cart;
