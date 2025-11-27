import { useState } from 'react'
import { Truck, Calendar, IndianRupee } from 'lucide-react'
import { shippingAPI } from '../../services/api'
import toast from 'react-hot-toast'

const defaultAddress = {
  firstName: 'Guest',
  lastName: 'User',
  email: 'guest@example.com',
  phone: '+91 99999 99999',
  address: 'MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  zipCode: '560001',
  country: 'India',
}

const ShippingEstimator = ({ product, quantity = 1 }) => {
  const [addr, setAddr] = useState(defaultAddress)
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState(null)

  const onChange = (e) => {
    const { name, value } = e.target
    setAddr((a) => ({ ...a, [name]: value }))
  }

  const check = async () => {
    setLoading(true)
    setQuote(null)
    try {
      const items = [{ price: product?.price || 0, quantity: quantity || 1 }]
      const res = await shippingAPI.calculateShipping({ items, shipping: addr })
      setQuote(res)
    } catch (e) {
      console.error('Shipping quote error:', e)
      toast.error(e?.message || 'Failed to get shipping estimate')
    } finally {
      setLoading(false)
    }
  }

  // Helpers
  const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
  const formatEta = (eta) => {
    if (!eta) return 'N/A'
    const d = new Date(eta)
    if (isNaN(d.getTime())) return String(eta)
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (product?.shipping?.type === 'PICKUP_ONLY') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start">
          <Truck className="h-5 w-5 text-yellow-700 mt-0.5 mr-3" />
          <div>
            <div className="font-semibold text-yellow-900">Pickup Only</div>
            <div className="text-sm text-yellow-800">This item is only available for local pickup from the seller.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {product?.shipping?.type === 'FLAT' && typeof product?.shipping?.amount === 'number' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          Flat shipping fee: <span className="font-semibold">{inr(product.shipping.amount)}</span> per unit
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          name="zipCode"
          value={addr.zipCode}
          onChange={onChange}
          placeholder="PIN code"
          className="input sm:col-span-1"
        />
        <input
          name="city"
          value={addr.city}
          onChange={onChange}
          placeholder="City"
          className="input sm:col-span-1"
        />
        <input
          name="state"
          value={addr.state}
          onChange={onChange}
          placeholder="State"
          className="input sm:col-span-1"
        />
        <button onClick={check} disabled={loading} className="btn btn-outline sm:col-span-1">
          {loading ? 'Checking...' : 'Check Shipping'}
        </button>
      </div>

      {quote && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-5 w-5 text-green-700" />
              <div>
                <div className="text-xs text-green-700">Shipping</div>
                <div className="font-semibold text-green-900">{inr(quote.cost)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-700" />
              <div>
                <div className="text-xs text-green-700">Estimated Delivery</div>
                <div className="font-semibold text-green-900">{formatEta(quote.estimatedDelivery) || '3-7 days'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-green-700" />
              <div>
                <div className="text-xs text-green-700">Carrier</div>
                <div className="font-semibold text-green-900">{quote.carrier?.toUpperCase?.() || 'BLUEDART'}</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-green-700 mt-2">Free shipping on orders over ₹{quote.freeShippingThreshold || 999}</div>
        </div>
      )}
    </div>
  )
}

export default ShippingEstimator
