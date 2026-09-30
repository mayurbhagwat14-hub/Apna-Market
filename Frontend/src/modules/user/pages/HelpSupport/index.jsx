import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSearch,
  FiMessageCircle,
  FiMail,
  FiPhone,
  FiChevronRight,
  FiHelpCircle,
  FiBook,
  FiAlertCircle,
  FiClock,
  FiSend,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { useBranding } from '../../../../context/BrandingContext';
import { Button, Input, Textarea, Modal, Badge, EmptyState } from '../../../../components/ui';
import { gradients } from '../../../../theme';

const CATEGORY_STYLES = {
  discovery: { icon: FiBook, iconClass: 'text-[#016A54]', bgClass: 'bg-[#EDF8F5]' },
  vendors: { icon: FiClock, iconClass: 'text-[#016A54]', bgClass: 'bg-[#EDF8F5]' },
  account: { icon: FiAlertCircle, iconClass: 'text-[#016A54]', bgClass: 'bg-[#EDF8F5]' },
};

const QUICK_ACTION_STYLES = {
  chat: { icon: FiMessageCircle, iconClass: 'text-[#25D366]', bgClass: 'bg-[#25D366]/10' },
  email: { icon: FiMail, iconClass: 'text-[#016A54]', bgClass: 'bg-[#EDF8F5]' },
  call: { icon: FiPhone, iconClass: 'text-[#016A54]', bgClass: 'bg-[#EDF8F5]' },
};

const HelpSupport = () => {
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [supportInfo, setSupportInfo] = useState({
    email: `support@apnamarket.com`,
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/public/config');
        if (response.data?.success && response.data?.settings) {
          const { supportEmail, supportPhone, supportWhatsapp } = response.data.settings;
          setSupportInfo({
            email: supportEmail || `support@apnamarket.com`,
            phone: supportPhone || '+91 98765 43210',
            whatsapp: supportWhatsapp || '+91 98765 43210',
          });
        }
      } catch (error) {
        console.error('Failed to fetch support settings:', error);
      }
    };
    fetchSettings();
  }, [branding.appName]);

  const categories = [
    {
      id: 'discovery',
      title: 'Exploring Local Shops & Offers',
      questions: [
        {
          q: 'How do I contact a shop or restaurant?',
          a: 'Open any business listing and tap "Call Shop" to directly speak with the merchant or "Directions" to navigate via Google Maps.',
        },
        {
          q: 'How do I find discounts and deals near me?',
          a: 'You can discover active weekend offers on the Home screen or filter by "Offers & Deals" in the Explore page.',
        },
        {
          q: 'Are the shop timings and addresses verified?',
          a: 'Yes! All businesses on Apna Market have verified physical addresses and updated operating hours in Indore.',
        },
      ],
    },
    {
      id: 'vendors',
      title: 'Business & Store Owners',
      questions: [
        {
          q: 'Can I list my shop on Apna Market?',
          a: 'Yes, local shopkeepers, restaurants, and service providers can list their business, photos, address, and offers to reach thousands of nearby customers.',
        },
        {
          q: 'Does Apna Market charge commission on sales?',
          a: 'Apna Market is a direct marketing and discovery platform. Customers connect directly with your store, so you keep 100% of your earnings!',
        },
      ],
    },
    {
      id: 'account',
      title: 'Account & Saved Businesses',
      questions: [
        {
          q: 'How do I save a favorite shop?',
          a: 'Tap the heart icon on any shop card or detail page. You can easily view all your saved businesses anytime under the "Saved" tab in the bottom navigation.',
        },
        {
          q: 'How do I update my profile details?',
          a: 'Navigate to the Profile tab and tap the edit pencil icon next to your name to change your name, email, or photo.',
        },
      ],
    },
  ];

  const quickActions = [
    {
      id: 'chat',
      title: 'WhatsApp Chat',
      subtitle: 'Chat with our support team',
      action: () => {
        if (supportInfo.whatsapp) {
          const cleanNumber = supportInfo.whatsapp.replace(/\D/g, '');
          window.location.href = `whatsapp://send?phone=${cleanNumber}`;
        } else {
          toast('WhatsApp support is currently unavailable');
        }
      },
    },
    {
      id: 'email',
      title: 'Email Us',
      subtitle: supportInfo.email,
      action: () => {
        window.location.href = `mailto:${supportInfo.email}`;
      },
    },
    {
      id: 'call',
      title: 'Call Us',
      subtitle: supportInfo.phone || 'Not Available',
      action: () => {
        if (supportInfo.phone) {
          window.location.href = `tel:${supportInfo.phone}`;
        } else {
          toast('Phone support is currently unavailable');
        }
      },
    },
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill all fields');
      return;
    }
    toast.success("Your message has been sent! We'll get back to you soon.");
    setShowContactForm(false);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const filteredQuestions = categories.flatMap((cat) =>
    cat.questions
      .filter(
        (q) =>
          searchQuery === '' ||
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((q) => ({ ...q, category: cat.title, categoryId: cat.id }))
  );

  return (
    <div className="min-h-screen pb-24 relative bg-[#FBFBFA] w-full max-w-lg mx-auto shadow-xs font-sans text-neutral-900">
      <div className="relative z-10">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#F0F2F1] px-4 py-3.5">
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-[#F5F7F6] flex items-center justify-center text-neutral-800 hover:bg-[#EAEFEA] active:scale-95 transition-all"
              aria-label="Go back"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-neutral-900">Help & Support</h1>
          </div>
          <div className="pt-1">
            <div className="relative w-full">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7F6] rounded-full border border-neutral-200/80 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#016A54]/20 focus:border-[#016A54] transition-all"
              />
            </div>
          </div>
        </header>

        <main className="px-4 pt-4">
          <section className="mb-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Contact us</h2>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => {
                const style = QUICK_ACTION_STYLES[action.id];
                const Icon = style.icon;
                let href = null;
                if (action.id === 'chat' && supportInfo.whatsapp) {
                  href = `whatsapp://send?phone=${supportInfo.whatsapp.replace(/\D/g, '')}`;
                } else if (action.id === 'email' && supportInfo.email) {
                  href = `mailto:${supportInfo.email}`;
                } else if (action.id === 'call' && supportInfo.phone) {
                  href = `tel:${supportInfo.phone.replace(/\D/g, '')}`;
                }
                const Component = href ? 'a' : 'button';
                return (
                  <Component
                    key={action.id}
                    href={href}
                    type={href ? undefined : 'button'}
                    onClick={!href ? action.action : undefined}
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-neutral-100 flex items-center gap-4 w-full text-left"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.bgClass}`}
                    >
                      <Icon className={`w-6 h-6 ${style.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900">{action.title}</h3>
                      <p className="text-sm text-neutral-600 truncate">{action.subtitle}</p>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
                  </Component>
                );
              })}
            </div>
          </section>

          <Button
            type="button"
            fullWidth
            variant="primary"
            icon={FiSend}
            className="mb-6"
            onClick={() => setShowContactForm(true)}
          >
            Submit a request
          </Button>

          {searchQuery === '' && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">Browse by category</h2>
              <div className="space-y-3">
                {categories.map((category) => {
                  const style = CATEGORY_STYLES[category.id];
                  const CatIcon = style.icon;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(category.id === selectedCategory ? null : category.id)
                      }
                      className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-neutral-100 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bgClass}`}
                          >
                            <CatIcon className={`w-5 h-5 ${style.iconClass}`} />
                          </div>
                          <h3 className="font-semibold text-neutral-900">{category.title}</h3>
                        </div>
                        <FiChevronRight
                          className={`w-5 h-5 text-neutral-400 transition-transform ${
                            selectedCategory === category.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                      {selectedCategory === category.id && (
                        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
                          {category.questions.map((item, idx) => (
                            <div key={idx}>
                              <div className="flex items-start gap-2 mb-2">
                                <FiHelpCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                <p className="font-medium text-neutral-900 text-sm">{item.q}</p>
                              </div>
                              <p className="text-sm text-neutral-600 ml-6">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {searchQuery !== '' && (
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                Search results ({filteredQuestions.length})
              </h2>
              {filteredQuestions.length === 0 ? (
                <EmptyState
                  icon="search"
                  title="No results found"
                  message={`Nothing matched "${searchQuery}". Try different keywords or contact support.`}
                  actionLabel="Contact support"
                  onAction={() => setShowContactForm(true)}
                />
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
                        <Badge variant="primary" size="sm" className="mb-2">
                          {item.category}
                        </Badge>
                        <div className="flex items-start gap-2 mb-2">
                          <FiHelpCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                          <p className="font-medium text-neutral-900 text-sm">{item.q}</p>
                        </div>
                        <p className="text-sm text-neutral-600 ml-6">{item.a}</p>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <Modal
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        title="Submit a request"
        size="md"
      >
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your.email@example.com"
            required
          />
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Brief description of your issue"
            required
          />
          <Textarea
            label="Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={5}
            placeholder="Describe your issue in detail..."
            required
          />
          <Button type="submit" fullWidth variant="primary" icon={FiSend}>
            Submit request
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default HelpSupport;
