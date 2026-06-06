import { createContext, useContext, useState, useEffect } from 'react'

const FavorisContext = createContext(null)

export function FavorisProvider({ children }) {
  // Persistance dans localStorage
  const [favoris, setFavoris] = useState(() => {
    try {
      const saved = localStorage.getItem('dealoo_favoris')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('dealoo_favoris', JSON.stringify(favoris))
  }, [favoris])

  function toggleFavori(articleId) {
    setFavoris(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    )
  }

  function isFavori(articleId) {
    return favoris.includes(articleId)
  }

  return (
    <FavorisContext.Provider value={{ favoris, toggleFavori, isFavori }}>
      {children}
    </FavorisContext.Provider>
  )
}

export function useFavoris() {
  return useContext(FavorisContext)
}
