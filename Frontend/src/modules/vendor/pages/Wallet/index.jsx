import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiArrowUp, FiArrowDown, FiArrowRight, FiClock, FiCheckCircle, FiAlertCircle, FiSend, FiX } from 'react-icons/fi';
import { gradients } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { Button, EmptyState, Loader } from '../../../../components/ui';
import vendorWalletService from '../../../../services/vendorWalletService';
import { toast } from 'react-hot-toast';

const Wallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({
    balance: 0,
    dues: 0,
    earnings: 0,
    amountDue: 0,
    totalCashCollected: 0,
    totalSettled: 0,
    totalWithdrawn: 0,
    pendingSettlements: 0,
    cashLimit: 10000
  });
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, txnRes] = await Promise.all([
        vendorWalletService.getWallet(),
        vendorWalletService.getTransactions({ limit: 50 })
      ]);

      if (walletRes.success) {
        setWallet(walletRes.data);
      }

      if (txnRes.success) {
        setTransactions(txnRes.data || []);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') return true;
    return txn.type === filter;
  });

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'cash_collected':
        return <FiArrowDown className="w-5 h-5 text-red-500" />;
      case 'earnings_credit':
        return <FiArrowUp className="w-5 h-5 text-green-500" />;
      case 'settlement':
        return <FiSend className="w-5 h-5 text-primary-400" />;
      case 'withdrawal':
        return <FiDollarSign className="w-5 h-5 text-purple-500" />;
      case 'tds_deduction':
        return <FiAlertCircle className="w-5 h-5 text-amber-500" />;
      case 'commission':
        return <FiDollarSign className="w-5 h-5 text-orange-500" />;
      case 'platform_fee':
        return <FiAlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <FiDollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'cash_collected':
        return 'Cash Collected';
      case 'earnings_credit':
        return 'Earnings Credited';
      case 'settlement':
        return 'Settlement Paid';
      case 'withdrawal':
        return 'Withdrawal Payout';
      case 'tds_deduction':
        return 'TDS Deduction';
      case 'commission':
        return 'Commission';
      case 'platform_fee':
        return 'Platform Charge';
      default:
        return type;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
        <Loader className="relative z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />
      <div className="relative z-10">
      <Header title="Wallet & Ledger" />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Earnings Card (Green) */}
        <div className="rounded-2xl p-6 shadow-xl relative overflow-hidden mb-4 bg-gradient-to-br from-green-600 to-green-800">
          <div className="relative z-10 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Available Earnings</p>
                <p className="text-3xl font-bold mb-4">₹{wallet.earnings?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
            </div>

            <button
              onClick={() => navigate('/vendor/wallet/withdraw')}
              className="w-full bg-white text-green-700 py-3 rounded-xl font-bold text-sm hover:bg-green-50 active:scale-95 transition-all shadow-sm"
            >
              Request Withdrawal
            </button>
          </div>
        </div>

        {/* Dues Card (Red) */}
        <div className="rounded-2xl p-6 shadow-xl relative overflow-hidden mb-6 bg-gradient-to-br from-red-600 to-red-800">
          <div className="relative z-10 text-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white/80 text-sm font-medium">Amount Due to Admin</p>
                  {wallet.dues > 0 && <FiAlertCircle className="w-4 h-4 text-red-200 animate-pulse" />}
                </div>
                <p className="text-3xl font-bold mb-4">₹{wallet.dues?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <FiArrowDown className="w-6 h-6 text-white" />
              </div>
            </div>

            {wallet.dues > 0 ? (
              <button
                onClick={() => navigate('/vendor/wallet/settle')}
                className="w-full bg-white text-red-700 py-3 rounded-xl font-bold text-sm hover:bg-red-50 active:scale-95 transition-all shadow-sm"
              >
                Pay Now
              </button>
            ) : (
              <div className="w-full bg-white/10 text-white py-3 rounded-xl font-medium text-sm text-center border border-white/20">
                No Dues Pending
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Cash Collected */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-red-50">
                <FiArrowDown className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xs text-gray-600 font-semibold">Cash Collected</p>
            </div>
            <p className="text-xl font-bold text-red-600">
              ₹{wallet.totalCashCollected?.toLocaleString() || 0}
            </p>
          </div>

          {/* Total Settled */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-green-50">
                <FiArrowUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs text-gray-600 font-semibold">Total Settled</p>
            </div>
            <p className="text-xl font-bold text-green-600">
              ₹{wallet.totalSettled?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Blocked Status Notice */}
        {wallet.isBlocked && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <FiX className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">Account Blocked</p>
                <p className="text-sm text-red-600 mb-2">
                  {wallet.blockReason || 'Your account is blocked due to excessive dues.'}
                </p>
                <button
                  onClick={() => navigate('/vendor/wallet/settle')}
                  className="text-xs font-bold uppercase tracking-wider text-white bg-red-600 px-3 py-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
                >
                  Pay Now to Unblock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cash Limit Indicator */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-6 border border-blue-50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Cash Collection Limit</p>
            <p className="text-xs font-medium text-gray-500">
              ₹{(wallet.dues || 0).toLocaleString()} / ₹{(wallet.cashLimit || 10000).toLocaleString()}
            </p>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${(wallet.dues / (wallet.cashLimit || 10000)) > 0.8 ? 'bg-error-500' : 'bg-primary-500'
                }`}
              style={{ width: `${Math.min(100, (wallet.dues / (wallet.cashLimit || 10000)) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            * Your account will be auto-blocked if you exceed the ₹{(wallet.cashLimit || 10000).toLocaleString()} limit.
          </p>
        </div>



        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'cash_collected', label: 'Cash Collected' },
            { id: 'settlement', label: 'Settlements' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'tds_deduction', label: 'TDS' },
            { id: 'platform_fee', label: 'Platform Fees' },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all shadow-sm ${
                filter === filterOption.id
                  ? 'bg-primary-600 text-white shadow-primary-600/30'
                  : 'bg-white text-neutral-700'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Transactions/Ledger */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4">Transaction History</h3>
          {filteredTransactions.length === 0 ? (
            <EmptyState message="No transactions yet. Your ledger will appear here when you complete jobs or settlements." />
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((txn) => (
                <div
                  key={txn._id}
                  className="bg-white rounded-xl p-4 shadow-md border-l-4"
                  style={{
                    borderLeftColor:
                      txn.type === 'cash_collected' ? '#DC2626' :
                        txn.type === 'settlement' ? '#10B981' :
                          txn.type === 'withdrawal' ? '#8B5CF6' :
                            txn.type === 'tds_deduction' ? '#F59E0B' :
                              txn.type === 'platform_fee' ? '#E11D48' : '#F97316'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background:
                          txn.type === 'cash_collected' ? '#FEE2E2' :
                            txn.type === 'settlement' ? '#D1FAE5' :
                              txn.type === 'withdrawal' ? '#EDE9FE' :
                                txn.type === 'tds_deduction' ? '#FEF3C7' :
                                  txn.type === 'platform_fee' ? '#FFF1F2' : '#FFEDD5'
                      }}
                    >
                      {getTransactionIcon(txn.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900 text-sm">
                          {getTransactionLabel(txn.type)}
                        </p>
                        <p className={`text-lg font-bold ${['cash_collected', 'tds_deduction', 'withdrawal', 'platform_fee'].includes(txn.type)
                          ? 'text-red-600'
                          : 'text-green-600'
                          }`}>
                          {['cash_collected', 'tds_deduction', 'withdrawal', 'platform_fee'].includes(txn.type) ? '-' : '+'}₹{Math.abs(txn.amount).toLocaleString()}
                        </p>
                      </div>

                      <p className="text-xs text-gray-600 truncate mb-1">{txn.description}</p>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{formatDate(txn.createdAt)}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${txn.status === 'completed' ? 'bg-green-100 text-green-700' :
                          txn.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {txn.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View Settlements Link */}
        <button
          onClick={() => navigate('/vendor/wallet/settlements')}
          className="w-full mt-6 py-3 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          View Settlement History
          <FiArrowRight className="w-4 h-4" />
        </button>
      </main>

      <BottomNav />
      </div>
    </div>
  );
};

export default Wallet;
