import { useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import './ShopNames.css'

interface Shop {
  _id?: any
  id?: any
  shopName: string
  shopType: string
}

export default function ShopNames() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const shopList = useQuery((api as any).shopNames.listShopNames) as Shop[] | undefined
  const createShop = useMutation((api as any).shopNames.createShop)
  const updateShop = useMutation((api as any).shopNames.updateShop)
  const deleteShop = useMutation((api as any).shopNames.deleteShop)
  const importShopNames = useMutation((api as any).shopNames.importShopNames)
  const shops = shopList ?? []
  const [shopName, setShopName] = useState('')
  const [shopType, setShopType] = useState('')
  const [editingId, setEditingId] = useState<any | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const resetForm = () => {
    setShopName('')
    setShopType('')
    setEditingId(null)
  }

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName.trim()) return
    try {
      if (editingId !== null) {
        await updateShop({ id: editingId, shopName: shopName.trim(), shopType: shopType.trim() || 'Unknown' })
        resetForm()
        return
      }

      await createShop({ shopName: shopName.trim(), shopType: shopType.trim() || 'Unknown' })
      resetForm()
    } catch (err) {
      console.error('Shop mutation error', err)
    }
  }

  const handleEdit = (s: Shop) => {
    setEditingId(s._id ?? s.id)
    setShopName(s.shopName)
    setShopType(s.shopType)
  }

  const handleDelete = async (id: any) => {
    if (!confirm('Delete this shop?')) return
    try {
      await deleteShop({ id })
      if (editingId === id) resetForm()
    } catch (err) {
      console.error('Delete shop error', err)
    }
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const parseCsv = (csvText: string) => {
    const rows = csvText
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter((row) => row.length > 0)
    if (rows.length === 0) {
      throw new Error('CSV file is empty')
    }

    const header = rows[0].split(',').map((col) => col.trim().toLowerCase())
    const shopNameIndex = header.findIndex((col) => col === 'shopname' || col === 'shop name')
    const shopTypeIndex = header.findIndex((col) => col === 'shoptype' || col === 'shop type')

    if (shopNameIndex === -1 || shopTypeIndex === -1) {
      throw new Error('CSV header must include ShopName and ShopType columns')
    }

    return rows.slice(1).map((row) => {
      const values = row.split(',').map((value) => value.trim())
      return {
        shopName: values[shopNameIndex] ?? '',
        shopType: values[shopTypeIndex] ?? '',
      }
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImporting(true)

    try {
      const text = await file.text()
      const shopsToImport = parseCsv(text)
      const invalidRows = shopsToImport.filter((shop) => !shop.shopName.trim())
      if (invalidRows.length > 0) {
        throw new Error('Some rows are missing ShopName values')
      }

      await importShopNames({ shops: shopsToImport })
      resetForm()
    } catch (err: any) {
      setImportError(err?.message || 'Failed to import CSV file')
      console.error('CSV import error', err)
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <section className="settings-panel">
      <h2>Shop Name Settings</h2>

      <form className="shop-form" onSubmit={handleAddOrUpdate}>
        <input
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
        />
        <input
          placeholder="Shop Type"
          value={shopType}
          onChange={(e) => setShopType(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          {editingId !== null ? 'Update Shop' : 'Add Shop'}
        </button>
        {editingId !== null && (
          <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
            Cancel
          </button>
        )}
      </form>

      <div className="shop-import-row">
        <button type="button" className="btn-primary" onClick={handleFileSelect} disabled={importing}>
          {importing ? 'Importing CSV...' : 'Import CSV'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {importError && <p className="import-error">{importError}</p>}
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Shop Name</th>
              <th>Shop Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>No shops yet.</td>
              </tr>
            ) : (
              shops.map((s, idx) => {
                const recordId = s._id ?? s.id
                return (
                  <tr key={String(recordId)}>
                    <td>{idx + 1}</td>
                    <td>{s.shopName}</td>
                    <td>{s.shopType}</td>
                    <td>
                      <button className="btn-secondary" onClick={() => handleEdit(s)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(recordId)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
