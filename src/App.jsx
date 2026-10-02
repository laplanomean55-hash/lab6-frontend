
import { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState({
    product_name: '',
    description: '',
    price: '',
    quantity: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok && data.access_token) {
        localStorage.setItem('token', data.access_token)
        setToken(data.access_token)
        setMessage('')
      } else {
        setMessage(data.message || data.error || 'Invalid username or password.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setMessage('Cannot connect to the LavaLust API.')
    }
  }

  const fetchProducts = async () => {
    if (!token) return

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        const list = Array.isArray(data)
          ? data
          : data.products || data.data || []

        setProducts(list)
      } else {
        setMessage(data.message || data.error || 'Failed to load products.')

        if (response.status === 401) {
          handleLogout()
        }
      }
    } catch (error) {
      console.error('Fetch products error:', error)
      setMessage('Unable to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchProducts()
    }
  }, [token])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setForm({
      product_name: '',
      description: '',
      price: '',
      quantity: ''
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const isEditing = editingId !== null
    const url = isEditing
      ? `${API_BASE_URL}/products/${editingId}`
      : `${API_BASE_URL}/products`

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity)
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(isEditing ? 'Product updated successfully.' : 'Product added successfully.')
        resetForm()
        fetchProducts()
      } else {
        setMessage(data.message || data.error || 'Unable to save product.')
      }
    } catch (error) {
      console.error('Save product error:', error)
      setMessage('Unable to connect to the API.')
    }
  }

  const handleEdit = (product) => {
    setEditingId(product.id)
    setForm({
      product_name: product.product_name || '',
      description: product.description || '',
      price: product.price ?? '',
      quantity: product.quantity ?? ''
    })
    setMessage('')
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?')
    if (!confirmed) return

    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Product deleted successfully.')
        fetchProducts()
      } else {
        setMessage(data.message || data.error || 'Unable to delete product.')
      }
    } catch (error) {
      console.error('Delete product error:', error)
      setMessage('Unable to connect to the API.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUsername('')
    setPassword('')
    setProducts([])
    setMessage('')
    resetForm()
  }

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.loginCard}>
          <h1 style={styles.title}>Product Management System</h1>
          <h2 style={styles.subtitle}>Login to Your Account</h2>

          <form onSubmit={handleLogin}>
            <label style={styles.label} htmlFor="username">Username</label>
            <input
              id="username"
              style={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label style={styles.label} htmlFor="password">Password</label>
            <input
              id="password"
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button style={styles.primaryButton} type="submit">
              Login
            </button>
          </form>

          {message && <p style={styles.message}>{message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Product Management</h1>
            <p style={styles.subtitle}>Manage your products</p>
          </div>

          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </header>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            {editingId !== null ? 'Edit Product' : 'Add Product'}
          </h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label} htmlFor="product_name">Product Name</label>
                <input
                  id="product_name"
                  name="product_name"
                  style={styles.input}
                  value={form.product_name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label style={styles.label} htmlFor="price">Price</label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  style={styles.input}
                  value={form.price}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label style={styles.label} htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  style={styles.input}
                  value={form.quantity}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div>
                <label style={styles.label} htmlFor="description">Description</label>
                <input
                  id="description"
                  name="description"
                  style={styles.input}
                  value={form.description}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button style={styles.primaryButton} type="submit">
                {editingId !== null ? 'Update Product' : 'Add Product'}
              </button>

              {editingId !== null && (
                <button
                  style={styles.secondaryButton}
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {message && <p style={styles.message}>{message}</p>}

        <section style={styles.card}>
          <div style={styles.tableHeader}>
            <h2 style={styles.sectionTitle}>Product List</h2>
            <button style={styles.secondaryButton} onClick={fetchProducts}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Product Name</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Quantity</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td style={styles.td}>{product.id}</td>
                      <td style={styles.td}>{product.product_name}</td>
                      <td style={styles.td}>{product.description}</td>
                      <td style={styles.td}>₱{Number(product.price).toFixed(2)}</td>
                      <td style={styles.td}>{product.quantity}</td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            style={styles.editButton}
                            onClick={() => handleEdit(product)}
                          >
                            Edit
                          </button>
                          <button
                            style={styles.deleteButton}
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f7f8e9',
    padding: '32px 20px',
    fontFamily: 'Arial, sans-serif',
    color: '#29432d',
    boxSizing: 'border-box',
    lineHeight: 1.5
  },
  container: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto'
  },
  loginCard: {
    maxWidth: '400px',
    width: '100%',
    boxSizing: 'border-box',
    margin: '70px auto',
    padding: '30px',
    background: '#fffdf3',
    borderRadius: '12px',
    boxShadow: '0 4px 18px rgba(0,0,0,0.08)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '28px'
  },
  title: {
    margin: '0 0 8px',
    color: '#214b30',
    fontSize: '28px',
    lineHeight: 1.3,
    overflowWrap: 'break-word'
  },
  subtitle: {
    margin: 0,
    color: '#66785b',
    fontSize: '16px',
    lineHeight: 1.5
  },
  card: {
    background: '#fffdf3',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
    marginBottom: '24px',
    boxSizing: 'border-box',
    minWidth: 0
  },
  sectionTitle: {
    margin: '0 0 20px',
    fontSize: '21px',
    lineHeight: 1.4,
    color: '#214b30',
    overflowWrap: 'break-word'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '15px',
    lineHeight: 1.5,
    color: '#38563a'
  },
  input: {
    display: 'block',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '12px 14px',
    border: '1px solid #c5d1a8',
    borderRadius: '7px',
    marginBottom: '16px',
    fontSize: '15px',
    lineHeight: 1.5,
    color: '#29432d',
    background: '#fffef8'
  },
  primaryButton: {
    background: '#2e653b',
    color: '#fff8d5',
    border: 'none',
    borderRadius: '7px',
    padding: '12px 20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px',
    lineHeight: 1.5,
    whiteSpace: 'normal'
  },
  secondaryButton: {
    background: '#f4e6a5',
    color: '#38502b',
    border: 'none',
    borderRadius: '7px',
    padding: '11px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1.5
  },
  logoutButton: {
    background: '#315b38',
    color: '#fff8d5',
    border: 'none',
    borderRadius: '7px',
    padding: '11px 18px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: 1.5
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  message: {
    padding: '12px 16px',
    background: '#fff0bd',
    color: '#725515',
    borderRadius: '7px',
    marginBottom: '18px',
    lineHeight: 1.5,
    overflowWrap: 'break-word'
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '18px'
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
    borderRadius: '8px'
  },
  table: {
    width: '100%',
    minWidth: '850px',
    borderCollapse: 'collapse',
    textAlign: 'left',
    tableLayout: 'auto'
  },
  th: {
    background: '#eaf0d4',
    padding: '14px 16px',
    borderBottom: '1px solid #d5dfb9',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    lineHeight: 1.5,
    color: '#38502b'
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid #e5e9d8',
    fontSize: '14px',
    lineHeight: 1.6,
    overflowWrap: 'break-word',
    verticalAlign: 'middle'
  },
  actionButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    minWidth: '130px'
  },
  editButton: {
    background: '#dceac8',
    color: '#2e653b',
    border: 'none',
    borderRadius: '5px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '13px',
    lineHeight: 1.5
  },
  deleteButton: {
    background: '#f4e6a5',
    color: '#725515',
    border: 'none',
    borderRadius: '5px',
    padding: '8px 12px',
    cursor: 'pointer'
  }
}

export default App