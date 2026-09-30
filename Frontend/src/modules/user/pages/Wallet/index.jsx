import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { walletService } from '../../../../services/walletService';
import NotificationBell from '../../components/common/NotificationBell';
import { Button, EmptyState, SkeletonCard } from '../../../../components/ui';
import { gradients } from '../../../../theme';

const Wallet = () => {
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading(true);
        const [balanceResponse, transactionsResponse] = await Promise.all([
          walletService.getBalance(),
          walletService.getTransactions(),
        ]);

        if (balanceResponse.success) {
          setWalletBalance(balanceResponse.data.balance || 0);
        }

        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.data || []);
        }
      } catch {
        toast.error('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, []);

  const penaltyTotal = transactions
    .filter((t) => ['penalty', 'fine', 'cancellation_fee', 'debit'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const spentTotal = transactions
    .filter((t) =>
      ['payment', 'withdrawal', 'platform_fee', 'convenience_fee', 'gst', 'worker_payment', 'cash_collected'].includes(
        t.type
      )
    )
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen pb-20 relative bg-neutral-50">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />

      <div className="relative z-10">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-neutral-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <FiArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">Wallet</h1>
          </div>
          <NotificationBell />
        </header>

        <main className="px-4 py-6 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => navigate('/user/rewards')}
            className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-4 relative overflow-hidden text-left w-full hover:bg-primary-100/80 transition-colors"
          >
            <h2 className="text-lg font-bold text-neutral-900 mb-1">Refer your friends and earn</h2>
            <p className="text-sm text-neutral-600">They get ₹100 and you get ₹100</p>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl opacity-90" aria-hidden>
              🎁
            </span>
          </button>

          <div className="bg-gradient-to-r from-primary-600 to-secondary-500 rounded-2xl p-6 mb-6 text-white shadow-brand relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1">Wallet balance</p>
              <p className="text-sm text-white/70 mb-2">
                Available: ₹{Math.abs(walletBalance || 0).toLocaleString('en-IN')}
              </p>
              <h2 className="text-3xl font-bold">
                -₹{penaltyTotal.toLocaleString('en-IN')}{' '}
                <span className="text-base font-normal text-white/80">(penalties)</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
              <p className="text-neutral-500 text-xs font-medium mb-1">Total spent</p>
              <p className="text-lg font-bold text-neutral-900">₹{spentTotal.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
              <p className="text-neutral-500 text-xs font-medium mb-1">Total penalty</p>
              <p className="text-lg font-bold text-warning-600">₹{penaltyTotal.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <h3 className="text-base font-bold text-neutral-900 mb-3">Recent transactions</h3>
          <div className="space-y-3">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : transactions.length === 0 ? (
              <EmptyState
                title="No wallet activity yet"
                message="Transactions from bookings and penalties will show up here."
              />
            ) : (
              transactions.map((item, index) => {
                const date = new Date(item.date);
                const formattedDate = date.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                let typeStyle = { color: 'text-neutral-600', bg: 'bg-neutral-100', sign: '' };

                if (['credit', 'refund', 'topup', 'referral', 'cashback', 'cash_collected'].includes(item.type)) {
                  typeStyle = { color: 'text-success-600', bg: 'bg-success-50', sign: '' };
                } else if (['payment', 'withdrawal'].includes(item.type)) {
                  typeStyle = { color: 'text-error-600', bg: 'bg-error-50', sign: '-' };
                } else if (['penalty', 'fine', 'cancellation_fee', 'debit'].includes(item.type)) {
                  typeStyle = { color: 'text-warning-600', bg: 'bg-warning-50', sign: '-' };
                }

                return (
                  <div
                    key={item.id || index}
                    className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeStyle.bg}`}
                      >
                        <span className={`text-sm font-bold ${typeStyle.color}`}>
                          {item.type === 'penalty' ? '!' : typeStyle.sign || '•'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {item.description || item.title || 'Transaction'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-neutral-500">{formattedDate}</p>
                          {item.type && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${typeStyle.bg} ${typeStyle.color}`}
                            >
                              {item.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className={`text-sm font-bold ${typeStyle.color}`}>
                        {typeStyle.sign}₹{item.amount.toLocaleString('en-IN')}
                      </p>
                      {item.balanceAfter !== undefined && (
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Bal: ₹{item.balanceAfter.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Wallet;
