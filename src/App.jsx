import { useState, useEffect } from 'react'

function App() {
  // Theme state for dark/light mode
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    console.log('Loaded theme from localStorage:', saved)
    return saved || 'light'
  })

  // Apply theme class to HTML element and save to localStorage
  useEffect(() => {
    // console.log('Theme changed to:', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light'
      console.log('Changing theme from', prev, 'to', newTheme)
      return newTheme
    })
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [shoppingList, setShoppingList] = useState(() => {
    const savedShopping = localStorage.getItem("shoppingList")
    return savedShopping ? JSON.parse(savedShopping) : []
  })

  //::::::::::::SORT BY CATEGORY:::::::::::::::::
  //define the categories of the dishes
  const categories = [
  'All',
  'Beef',
  'Chicken', 
  'Dessert',
  'Lamb',
  'Pasta',
  'Pork',
  'Seafood',
  'Vegetarian',
  'Vegan',
  'Breakfast'
  ]
  const CATEGORY_API = 'https://www.themealdb.com/api/json/v1/1/filter.php?c='


  // Remove extra spaces in API URL for search
  const API_BASE = 'https://www.themealdb.com/api/json/v1/1/search.php?s='
  const fetchRecipeByCategory = async (category) => {
    setLoading(true)
    setError(null)
    setSearchTerm("")

    try{
      const response = await fetch(`${CATEGORY_API}${category}`)
      const data = await response.json()

      if(data.meals){
        const recipeDetails = await Promise.all(
          data.meals.slice(0, 12).map(async (meal) => {
            const responseDetail = await fetch(
              `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
            )
            const detailsData = await responseDetail.json()
            return detailsData.meals[0]})
        )
        setRecipes(recipeDetails)
      } else {
        setRecipes([])
        setError(`No recipes found in ${category} category.`)
      }
    } catch (error){
      setError(`Failed to fetch recipes. Check your connection.`)
    } finally {
      setLoading(false)
    }
  }
  //setting up the useEffect to cheack for category changes

  useEffect(() => {
    if(selectedCategory && selectedCategory !== "All"){
      fetchRecipeByCategory(selectedCategory)
    } else if(selectedCategory === "All"){
      setRecipes([])
      setSearchTerm("")
    }
  }, [selectedCategory])

  useEffect(() => {
    // This is to  prevent the live search if less than 3 characters have been typedto reduce API calls
    if (searchTerm.length < 3) {
      setRecipes([])
      return
    }

    // Setup Debounce Timer to optimize the API calls
    const delayDebounce = setTimeout(() => {
      fetchRecipes()
    }, 600) 
    // Wait 600ms after user stops typing to then initiate the API call that searches for the food. If the user types again, stop the timeout
    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  //function to fetch the recipe from the API using the search item. Convert the response to json.
  const fetchRecipes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}${searchTerm}`)
      const data = await response.json()
//if the meal has not been found, it will return an empty array and error
      if (data.meals) {
        setRecipes(data.meals)
      } else {
        setRecipes([])
        setError('No recipes found. Try something else.')
      }
    } catch (err) {
      setError('Failed to fetch recipes. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

//function to extract the ingredients and measures from the API
function getIngredients(recipe){
  const ingredients = [];
  for(let i = 1; i <= 20; i++){
    const ingredient = recipe[`strIngredient${i}`]
    const measure = recipe[`strMeasure${i}`];

    if(ingredient && ingredient.trim() !== ""){
      // Return object with name and measure properties
      ingredients.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : ''
      });
    }
  }
  return ingredients;
}
  //function to embed the youtube video url
  function getYoutubeEmbed (url){
    if(!url) return null;
    const videoId = url.split("v=")[1]
    if(!videoId) return null
    // Fixed: Removed extra spaces in embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoId}`
    return embedUrl
  }
//Adding favorites dishes
  const [favorites, setFavorites] = useState(()=>{
    const saved = localStorage.getItem('recipeFavorites')
    return saved ? JSON.parse(saved) : []
  })
  //function to toggle between favorites
    const toggleFavorite = (recipe) => {
    const isFavorite = favorites.some(fav => fav.idMeal === recipe.idMeal)
    let newFavorites
    
    if (isFavorite) {
      newFavorites = favorites.filter(fav => fav.idMeal !== recipe.idMeal)
    } else {
      newFavorites = [...favorites, recipe]
    }
    
    setFavorites(newFavorites)
    localStorage.setItem('recipeFavorites', JSON.stringify(newFavorites))
  }
  //Function to check if a meal is alredya favorite
  const isFavorite = (recipeId) => {
    return favorites.some(fav => fav.idMeal === recipeId)
  }

  // :::::::::::::::SHOPPING LIST::::::::::::::::::::

  //Add shopping list functons for accessing data, updating and displaying data from the shopping list
  // Add a new item to the shopping list 
 const addToShoppingList = (ingredient) => {
    const existingItem = shoppingList.find(
      item => item.name.toLowerCase() === ingredient.name.toLowerCase()
    )
    
    let newShoppingList
    if (existingItem) {
      newShoppingList = shoppingList.map(item =>
        item.name.toLowerCase() === ingredient.name.toLowerCase()
          ? { ...item, measure: ingredient.measure }
          : item
      )
    } else {
      newShoppingList = [...shoppingList, { ...ingredient, checked: false }]
    }
    
    setShoppingList(newShoppingList)
    localStorage.setItem('shoppingList', JSON.stringify(newShoppingList))
    
    // Show toast notification
    setToast({ show: true, message: `${ingredient.name} added to shopping list!` })
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setToast({ show: false, message: '' })
    }, 3000)
  }

  // Add all the ingredients from the selected recipe to the shopping list
  const addIngredientsToShoppingList = (recipe) => {
    const ingredients = getIngredients(recipe)
    let newShoppingList = [...shoppingList]

    ingredients.forEach(ingredient => {
      const exists = newShoppingList.find(item => item.name.toLowerCase() === ingredient.name.toLowerCase())
      if(!exists){
        newShoppingList.push({...ingredient, checked: false})
      }
    })
    setShoppingList(newShoppingList)
    localStorage.setItem("shoppingList", JSON.stringify(newShoppingList))
    alert(`All the ingredients from ${recipe.meal} are successfully added to the shopping list`)
  }
  // Update an existing item in the shopping list
  const updateShoppingListItem = (index, updateItem, value) => {
    const newShoppingList = [...shoppingList]
    newShoppingList[index][updateItem] = value
    setShoppingList(newShoppingList)
    localStorage.setItem("shoppingList", JSON.stringify(newShoppingList))
  }
  //Remove an item from the shoppingList
  const removeFromShoppingList = (index) => {
    const newShoppingList = shoppingList.filter(item => item !== index)
    setShoppingList(newShoppingList)
    localStorage.setItem("shoppingList", JSON.stringify(newShoppingList))
  }
  //Function to toggle the checke mode
  const toggleChecked = (index) => {
    const newShoppingList = [...shoppingList]
    newShoppingList[index].checked = !newShoppingList[index].checked
    setShoppingList(newShoppingList)
    localStorage.setItem("shoppingList", JSON.stringify(newShoppingList))
  }
  //Function to clear the whole of the chopping list
  const clearShoppingList = () => {
    if (window.confirm("Are you sure you want to clear your shopping list?")){
      setShoppingList([])
      localStorage.removeItem("shoppingList")
    }
  }
  //Function to print the shopping list
  const printShoppingList = () => {
    window.print()
  }

  //:::::::::::VIEW RECIPE:::::::::::::
  if(selectedRecipe){
    const ingredients = getIngredients(selectedRecipe)
    const videoUrl = getYoutubeEmbed(selectedRecipe.strYoutube)

    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Header Image */}
          <div className="relative h-64 md:h-96">
            <img 
              src={selectedRecipe.strMealThumb} 
              alt={selectedRecipe.strMeal} 
              className="w-full h-full object-cover"
            />
            <button 
              onClick={() => setSelectedRecipe(null)}
              className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg font-semibold shadow-md transition"
            >
              ← Back to Search
            </button>
          </div>

          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">{selectedRecipe.strMeal}</h1>
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600 dark:text-gray-300">
              <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full">🍽️ {selectedRecipe.strCategory}</span>
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">🌍 {selectedRecipe.strArea}</span>
            </div>
            {/*Button to add ingredients to shopping list*/}
            <div className="flex gap-3 mb-6 print:hidden">
              <button
                onClick={() => addIngredientsToShoppingList(selectedRecipe)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                🛒 Add All Ingredients to Shopping List
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
            
              {/* Ingredients */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-2">Ingredients</h2>
                <ul className="space-y-2">
                  {ingredients.map((item, index) => (
                    <li key={index} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        {/* Display ingredient name */}
                        <span className="text-gray-800 dark:text-gray-100">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Display measure */}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.measure}
                        </span>
                        {/* Add button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addToShoppingList(item)
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm transition print:hidden font-medium"
                          title="Add to shopping list"
                        >
                          + Add
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Video */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-2">Video Tutorial</h2>
                {videoUrl ? (
                  <iframe 
                    className="w-full aspect-video rounded-lg shadow-md"
                    src={videoUrl} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No video available for this recipe.</p>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-2">Instructions</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{selectedRecipe.strInstructions}</p>
            </div>

            {/* Source Link */}
            <div className="mt-8 pt-6 border-t dark:border-gray-700">
              <a 
                href={selectedRecipe.strSource} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-semibold underline"
              >View Original Recipe</a>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  //:::::::::::VIEW SHOPPING LIST:::::::::::::
  if (showShoppingList) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-orange-600 dark:text-orange-400">
              🛒 Shopping List
            </h1>
            <button
              onClick={() => setShowShoppingList(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              ← Back to Recipes
            </button>
          </div>

          {/* Actions */}
          {shoppingList.length > 0 && (
            <div className="flex gap-4 mb-6 justify-end print:hidden">
              <button
                onClick={printShoppingList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                🖨️ Print List
              </button>
              <button
                onClick={clearShoppingList}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                🗑️ Clear All
              </button>
            </div>
          )}

          {/* Shopping List Items */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            {shoppingList.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p className="text-2xl mb-4">🛒</p>
                <p>Your shopping list is empty.</p>
                <p className="text-sm mt-2">Add ingredients from recipes to build your list!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {shoppingList.map((item, index) => (
                  <li
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      item.checked
                        ? 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecked(index)}
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 print:hidden"
                    />
                    <input
                      type="text"
                      value={item.measure}
                      onChange={(e) => updateShoppingListItem(index, 'measure', e.target.value)}
                      className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-100"
                      placeholder="Quantity"
                    />
                    <span className="flex-1 text-gray-800 dark:text-gray-100 font-medium">
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeFromShoppingList(index)}
                      className="text-red-500 hover:text-red-700 transition print:hidden"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ::::::::::VIEW SEARCH LIST::::::::::::
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto">
        
        {/* Logo and Header Section */}
        <div className="flex flex-col items-center mb-8 space-y-4">
          {/* Logo with styling */}
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img 
              src="https://plus.unsplash.com/premium_vector-1739863904916-f0cd6c8058b1?w=352&dpr=2&h=367&auto=format&fit=crop&q=60&ixlib=rb-4.1.0"
              alt="Recipe Finder Logo"
              className="relative w-28 h-28 md:w-32 md:h-32 object-contain rounded-full shadow-2xl transform group-hover:scale-105 transition-transform duration-300 bg-white dark:bg-gray-800 p-2"
            />
          </div>
          
          {/* Title and Theme Toggle */}
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-orange-600 dark:text-orange-400 text-center">
              RECIPE PRO
            </h1>
            
            {/* Simple Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-yellow-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
          
          {/* Tagline */}
          <p className="text-gray-600 dark:text-gray-400 text-center">
            Discover Delicious Recipes from Around the World 🌍
          </p>
        </div>

        {/* Decorative line to divide the page */}
        <div className="flex items-center justify-center mb-6 space-x-4">
          <div className="h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent w-1/4"></div>
          <span className="text-xl">🍳</span>
          <div className="h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent w-1/4"></div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <button
            onClick={() => {
              setShowFavorites(false)
              setShowShoppingList(false)
              setSelectedCategory('')
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              !showFavorites && !showShoppingList && !selectedCategory
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🔍 Search Recipes
          </button>
          <button
            onClick={() => setShowFavorites(true)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              showFavorites ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            ❤️ My Favorites ({favorites.length})
          </button>
          {/* 👇 ADD SHOPPING LIST TAB BUTTON HERE 👇 */}
          <button
            onClick={() => setShowShoppingList(true)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              showShoppingList ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🛒 Shopping List ({shoppingList.length})
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="flex gap-4 mb-8 justify-center">
          <input
            type="text"
            placeholder="Search for a meal (e.g., Chicken)..."
            className="px-4 py-2 border rounded-lg w-full max-w-md focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>Searching delicious recipes...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <p className="text-center text-red-500 font-medium">{error}</p>
        )}

        {/* No Results Message */}
        {!loading && !error && recipes.length === 0 && searchTerm.length >= 3 && (
          <p className="text-center text-gray-500 dark:text-gray-400">No results found. Try a different dish.</p>
        )}

        {/* Filter by category such as desserts */}
        {!showFavorites && (
          <div className="mb-6">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-3">
              Browse by Category:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedCategory === category
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {selectedCategory && (
              <div className="text-center mt-2">
                <p className="text-gray-600 dark:text-gray-400">
                  Showing: <span className="font-semibold text-orange-600 dark:text-orange-400">{selectedCategory}</span>
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="ml-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    (Clear filter)
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(showFavorites ? favorites : recipes).map((recipe) => (
            <div 
              key={recipe.idMeal} 
              onClick={() => setSelectedRecipe(recipe)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
            >
              <img
                src={recipe.strMealThumb}
                alt={recipe.strMeal}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{recipe.strMeal}</h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(recipe)
                    }}
                    className={`text-2xl transition ${
                      isFavorite(recipe.idMeal) ? 'text-red-500' : 'text-gray-300 dark:text-gray-600 hover:text-red-400'
                    }`}
                  >
                    ♥
                  </button>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>🍽️ {recipe.strCategory}</span>
                  <span>🌍 {recipe.strArea}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {showFavorites && favorites.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
            No favorites yet. Click the ♥ on recipes to add them to favorites!
          </p>
        )}
      </div>
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{toast.message}</span>
          </div>
        </div>
    )}
    </div>
  )
}

export default App