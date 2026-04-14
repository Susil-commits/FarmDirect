import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Phone, ShieldCheck, Plus, Minus } from 'lucide-react';

export default function AdminOrderManagement({ order, onUpdate }) {
  const [active, setActive] = useState('verification');
  const [verificationForm, setVerificationForm] = useState({
    status: order.verificationCall?.status || 'pending',
    verificationNotes: order.verificationCall?.verificationNotes || '',
  });
  const [approvalForm, setApprovalForm] = useState({
    status: order.adminApproval?.status || 'pending',
    rejectionReason: order.adminApproval?.rejectionReason || '',
    notes: order.adminApproval?.notes || '',
  });
  const [chargesForm, setChargesForm] = useState({
    amount: order.additionalCharges?.amount || 0,
    reason: order.additionalCharges?.reason || '',
  });
  const [fineForm, setFineForm] = useState({
    amount: order.issueFine?.amount || 0,
    reason: order.issueFine?.reason || '',
    ratingReduction: order.issueFine?.ratingReduction || 0,
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: order.totalWithCharges || 0,
    notes: order.paymentReceived?.notes || '',
  });

  const handleVerificationSubmit = async () => {
    try {
      await onUpdate(`/api/orders/${order._id}/verification-call`, verificationForm);
    } catch (error) {
      console.error('Verification update error:', error);
    }
  };

  const handleApprovalSubmit = async () => {
    try {
      await onUpdate(`/api/orders/${order._id}/admin-approval`, approvalForm);
    } catch (error) {
      console.error('Approval update error:', error);
    }
  };

  const handleChargesSubmit = async () => {
    try {
      await onUpdate(`/api/orders/${order._id}/additional-charges`, chargesForm);
    } catch (error) {
      console.error('Charges update error:', error);
    }
  };

  const handleFineSubmit = async () => {
    try {
      await onUpdate(`/api/orders/${order._id}/issue-fine`, fineForm);
    } catch (error) {
      console.error('Fine update error:', error);
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      await onUpdate(`/api/orders/${order._id}/payment-received`, paymentForm);
    } catch (error) {
      console.error('Payment update error:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b-2 border-gray-200 overflow-x-auto">
        {[
          { id: 'verification', label: '📞 Verification', icon: Phone },
          { id: 'approval', label: '✓ Approval', icon: ShieldCheck },
          { id: 'charges', label: '+ Charges', icon: Plus },
          { id: 'fine', label: '⚠ Fine', icon: AlertCircle },
          { id: 'payment', label: '💰 Payment', icon: Plus },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 md:px-6 py-3 font-semibold text-sm whitespace-nowrap transition-all ${
              active === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* VERIFICATION SECTION */}
        {active === 'verification' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Status</label>
              <div className="grid grid-cols-3 gap-2">
                {['pending', 'completed', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setVerificationForm({ ...verificationForm, status })}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      verificationForm.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={verificationForm.verificationNotes}
                onChange={(e) => setVerificationForm({ ...verificationForm, verificationNotes: e.target.value })}
                placeholder="Add verification notes..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                rows="3"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-blue-900">
                <strong>Call Attempts:</strong> {order.verificationCall?.attempts || 0}
              </p>
              {order.verificationCall?.verifiedAt && (
                <p className="text-sm text-blue-900 mt-2">
                  <strong>Last Verified:</strong> {new Date(order.verificationCall.verifiedAt).toLocaleString('en-IN')}
                </p>
              )}
            </div>

            <button
              onClick={handleVerificationSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
            >
              ✓ Save Verification
            </button>
          </div>
        )}

        {/* APPROVAL SECTION */}
        {active === 'approval' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Decision</label>
              <div className="grid grid-cols-3 gap-2">
                {['pending', 'approved', 'rejected', 'hold'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setApprovalForm({ ...approvalForm, status })}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      approvalForm.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {approvalForm.status === 'rejected' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason</label>
                <textarea
                  value={approvalForm.rejectionReason}
                  onChange={(e) => setApprovalForm({ ...approvalForm, rejectionReason: e.target.value })}
                  placeholder="Why are you rejecting this order?"
                  className="w-full px-4 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500 text-sm"
                  rows="3"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                value={approvalForm.notes}
                onChange={(e) => setApprovalForm({ ...approvalForm, notes: e.target.value })}
                placeholder="Add internal notes..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                rows="3"
              />
            </div>

            <button
              onClick={handleApprovalSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
            >
              ✓ Save Approval Decision
            </button>
          </div>
        )}

        {/* CHARGES SECTION */}
        {active === 'charges' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <p className="text-sm text-yellow-900">
                Add additional charges for issues caused by buyer (damage, returns, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
              <input
                type="number"
                value={chargesForm.amount}
                onChange={(e) => setChargesForm({ ...chargesForm, amount: parseFloat(e.target.value) })}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
              <textarea
                value={chargesForm.reason}
                onChange={(e) => setChargesForm({ ...chargesForm, reason: e.target.value })}
                placeholder="e.g., Damaged packaging, returned items, etc."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                rows="3"
              />
            </div>

            {order.additionalCharges?.amount > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-blue-900">
                  <strong>Current Charges:</strong> ₹{order.additionalCharges.amount.toFixed(2)}
                </p>
                <p className="text-sm text-blue-900 mt-1">Reason: {order.additionalCharges.reason}</p>
              </div>
            )}

            <button
              onClick={handleChargesSubmit}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition"
            >
              ⚠ Apply Charges
            </button>
          </div>
        )}

        {/* FINE SECTION */}
        {active === 'fine' && (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <p className="text-sm text-red-900">
                Issue fines to buyers for serious issues. This will reduce their rating permanently.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fine Amount (₹)</label>
              <input
                type="number"
                value={fineForm.amount}
                onChange={(e) => setFineForm({ ...fineForm, amount: parseFloat(e.target.value) })}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rating Reduction (⭐ out of 5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={fineForm.ratingReduction}
                onChange={(e) => setFineForm({ ...fineForm, ratingReduction: parseFloat(e.target.value) })}
                placeholder="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
              <textarea
                value={fineForm.reason}
                onChange={(e) => setFineForm({ ...fineForm, reason: e.target.value })}
                placeholder="e.g., Violated policy, fraudulent claim, abusive behavior, etc."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                rows="3"
              />
            </div>

            {order.issueFine?.amount > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <p className="text-sm text-red-900">
                  <strong>Current Fine:</strong> ₹{order.issueFine.amount.toFixed(2)}
                </p>
                <p className="text-sm text-red-900 mt-1">
                  <strong>Rating Reduction:</strong> -{order.issueFine.ratingReduction} ⭐
                </p>
                <p className="text-sm text-red-900 mt-1">Reason: {order.issueFine.reason}</p>
              </div>
            )}

            <button
              onClick={handleFineSubmit}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
            >
              ⚠ Issue Fine
            </button>
          </div>
        )}

        {/* PAYMENT SECTION */}
        {active === 'payment' && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-green-900">
                <strong>Amount to Collect:</strong> ₹{order.totalWithCharges?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-green-800 mt-2 space-y-1">
                <div>Base: ₹{order.totalAmount?.toFixed(2) || '0.00'}</div>
                {order.chargesAmount > 0 && <div>Charges: +₹{order.chargesAmount.toFixed(2)}</div>}
                {order.fineAmount > 0 && <div>Fine: +₹{order.fineAmount.toFixed(2)}</div>}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Received (₹)</label>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="Payment method, time, etc."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                rows="2"
              />
            </div>

            {order.paymentReceived?.amount > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <p className="text-sm text-green-900">
                  <strong>Payment Received:</strong> ₹{order.paymentReceived.amount.toFixed(2)}
                </p>
                <p className="text-sm text-green-900 mt-1">
                  On: {new Date(order.paymentReceived.receivedAt).toLocaleString('en-IN')}
                </p>
              </div>
            )}

            <button
              onClick={handlePaymentSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
            >
              ✓ Mark Payment Received
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
