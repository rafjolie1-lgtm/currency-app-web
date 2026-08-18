import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [currencies, setCurrencies] = useState([])
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('widgets')
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'EUR Widget', baseCurrency: 'EUR', displayCurrencies: ['USD', 'GBP', 'JPY'], type: 'compact', rates: {} }
    ]
  })
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [newWidget, setNewWidget] = useState({
    name: '',
    baseCurrency: 'EUR',
    displayCurrencies: [],
    type: 'grid'
  })

  useEffect(() => {
    fetchCurrencies()
  }, [])

  useEffect(() => {
    widgets.forEach(widget => {
      fetchWidgetRates(widget.id)
    })
  }, [widgets])

  useEffect(() => {
    localStorage.setItem('widgets', JSON.stringify(widgets))
  }, [widgets])

  const fetchCurrencies = async () => {
    try {
      const response = await fetch('http://currency-app-backend-nine.vercel.app/api/currencies')
      const data = await response.json()
      if (data.success) {
        setCurrencies(data.data.map(c => c.code))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchWidgetRates = async (widgetId) => {
  try {
    const widget = widgets.find(w => w.id === widgetId)
    const symbols = widget.displayCurrencies.join(',')
    const response = await fetch(`http://currency-app-backend-nine.vercel.app/api/rates/${symbols}?base=${widget.baseCurrency}`)
    
    if (!response.ok) {
      console.error('API Error:', response.status)
      return
    }
    
    const data = await response.json()
    console.log('Rates:', data)
    
    if (data.success) {
      setWidgets(prev => prev.map(w => 
        w.id === widgetId ? { ...w, rates: data.rates } : w
      ))
    }
  } catch (error) {
    console.error('Fetch Error:', error)
  }
}

  const addWidget = () => {
    if (!newWidget.name || newWidget.displayCurrencies.length === 0) {
      alert('Please fill in widget name and select currencies')
      return
    }

    const widget = {
      id: Date.now(),
      ...newWidget,
      rates: {}
    }

    setWidgets([...widgets, widget])
    setNewWidget({ name: '', baseCurrency: 'EUR', displayCurrencies: [], type: 'grid' })
    setShowAddWidget(false)
  }

  const deleteWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id))
  }

  const toggleCurrency = (currency) => {
    setNewWidget(prev => ({
      ...prev,
      displayCurrencies: prev.displayCurrencies.includes(currency)
        ? prev.displayCurrencies.filter(c => c !== currency)
        : [...prev.displayCurrencies, currency]
    }))
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>💱 Currency Widgets</h1>
        <button className="add-widget-btn" onClick={() => setShowAddWidget(!showAddWidget)}>
          {showAddWidget ? '✕ Cancel' : '+ Add Widget'}
        </button>
      </header>

      {showAddWidget && (
        <div className="widget-creator">
          <h2>Create New Widget</h2>
          
          <div className="form-group">
            <label>Widget Name:</label>
            <input 
              type="text" 
              placeholder="e.g., My Travel Widget"
              value={newWidget.name}
              onChange={(e) => setNewWidget({...newWidget, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Base Currency:</label>
            <select 
              value={newWidget.baseCurrency}
              onChange={(e) => setNewWidget({...newWidget, baseCurrency: e.target.value})}
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Display Currencies:</label>
            <div className="currency-selector">
              {currencies.map(curr => (
                <label key={curr} className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={newWidget.displayCurrencies.includes(curr)}
                    onChange={() => toggleCurrency(curr)}
                  />
                  {curr}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Widget Type:</label>
            <select 
              value={newWidget.type}
              onChange={(e) => setNewWidget({...newWidget, type: e.target.value})}
            >
              <option value="compact">Compact (2 columns)</option>
              <option value="grid">Grid (3 columns)</option>
              <option value="list">List (1 column)</option>
            </select>
          </div>

          <button className="create-btn" onClick={addWidget}>Create Widget</button>
        </div>
      )}

      <div className="widgets-container">
        {widgets.map(widget => (
          <div key={widget.id} className={`widget widget-${widget.type}`}>
            <div className="widget-header">
              <h3>{widget.name}</h3>
              <button 
                className="delete-btn"
                onClick={() => deleteWidget(widget.id)}
              >
                🗑️
              </button>
            </div>
            
            <div className="widget-base">
              <small>Base: <strong>{widget.baseCurrency}</strong></small>
              <button 
                className="refresh-btn-small"
                onClick={() => fetchWidgetRates(widget.id)}
              >
                🔄
              </button>
            </div>

            <div className={`widget-rates widget-rates-${widget.type}`}>
              {widget.displayCurrencies.map(curr => (
                <div key={curr} className="rate-item">
                  <span className="currency-code">{curr}</span>
                  <span className="rate-value">{widget.rates[curr] || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
