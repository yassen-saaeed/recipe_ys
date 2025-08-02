class MealExplorer {
            constructor() {
                this.baseURL = 'https://www.themealdb.com/api/json/v1/1';
                this.searchInput = document.getElementById('searchInput');
                this.searchBtn = document.getElementById('searchBtn');
                this.categorySelect = document.getElementById('categorySelect');
                this.mealsContainer = document.getElementById('mealsContainer');
                this.loading = document.getElementById('loading');
                this.noResults = document.getElementById('noResults');
                this.modal = document.getElementById('recipeModal');
                this.recipeContent = document.getElementById('recipeContent');
                
                this.init();
            }

            async init() {
                await this.loadCategories();
                await this.loadRandomMeals();
                this.setupEventListeners();
            }

            setupEventListeners() {
                this.searchBtn.addEventListener('click', () => this.searchMeals());
                this.searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.searchMeals();
                });
                this.categorySelect.addEventListener('change', (e) => {
                    if (e.target.value) {
                        this.searchByCategory(e.target.value);
                    } else {
                        this.loadRandomMeals();
                    }
                });

                document.querySelector('.close').addEventListener('click', () => {
                    this.modal.style.display = 'none';
                });
                window.addEventListener('click', (e) => {
                    if (e.target === this.modal) {
                        this.modal.style.display = 'none';
                    }
                });
            }

            showLoading() {
                this.loading.style.display = 'block';
                this.mealsContainer.style.display = 'none';
                this.noResults.style.display = 'none';
            }

            hideLoading() {
                this.loading.style.display = 'none';
            }

            async loadCategories() {
                try {
                    const response = await fetch(`${this.baseURL}/categories.php`);
                    const data = await response.json();
                    
                    data.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.strCategory;
                        option.textContent = category.strCategory;
                        this.categorySelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error loading categories:', error);
                }
            }

            async loadRandomMeals() {
                this.showLoading();
                try {
                    const meals = [];
                    for (let i = 0; i < 12; i++) {
                        const response = await fetch(`${this.baseURL}/random.php`);
                        const data = await response.json();
                        if (data.meals) {
                            meals.push(data.meals[0]);
                        }
                    }
                    this.displayMeals(meals);
                } catch (error) {
                    console.error('Error loading random meals:', error);
                    this.showNoResults();
                }
            }

            async searchMeals() {
                const query = this.searchInput.value.trim();
                if (!query) return;

                this.showLoading();
                try {
                    const response = await fetch(`${this.baseURL}/search.php?s=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    
                    if (data.meals) {
                        this.displayMeals(data.meals);
                    } else {
                        this.showNoResults();
                    }
                } catch (error) {
                    console.error('Error searching meals:', error);
                    this.showNoResults();
                }
            }

            async searchByCategory(category) {
                this.showLoading();
                try {
                    const response = await fetch(`${this.baseURL}/filter.php?c=${encodeURIComponent(category)}`);
                    const data = await response.json();
                    
                    if (data.meals) {
                        this.displayMeals(data.meals);
                    } else {
                        this.showNoResults();
                    }
                } catch (error) {
                    console.error('Error searching by category:', error);
                    this.showNoResults();
                }
            }

            displayMeals(meals) {
                this.hideLoading();
                this.mealsContainer.style.display = 'grid';
                this.mealsContainer.innerHTML = '';

                meals.forEach(meal => {
                    const mealCard = this.createMealCard(meal);
                    this.mealsContainer.appendChild(mealCard);
                });
            }

            createMealCard(meal) {
                const card = document.createElement('div');
                card.className = 'meal-card';
                card.innerHTML = `
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-image">
                    <div class="meal-info">
                        <h3 class="meal-title">${meal.strMeal}</h3>
                        ${meal.strCategory ? `<span class="meal-category">${meal.strCategory}</span>` : ''}
                        ${meal.strArea ? `<p class="meal-origin">Origin: ${meal.strArea}</p>` : ''}
                        <button class="view-recipe-btn">View Recipe</button>
                    </div>
                `;

                card.addEventListener('click', () => this.showRecipeDetails(meal.idMeal));
                return card;
            }

            async showRecipeDetails(mealId) {
                try {
                    const response = await fetch(`${this.baseURL}/lookup.php?i=${mealId}`);
                    const data = await response.json();
                    
                    if (data.meals) {
                        const meal = data.meals[0];
                        this.displayRecipeModal(meal);
                    }
                } catch (error) {
                    console.error('Error loading recipe details:', error);
                }
            }

            displayRecipeModal(meal) {
                const ingredients = this.getIngredients(meal);
                
                this.recipeContent.innerHTML = `
                    <div class="recipe-header">
                        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image">
                        <div class="recipe-title-overlay">
                            <h2>${meal.strMeal}</h2>
                            <p>${meal.strCategory} • ${meal.strArea}</p>
                        </div>
                    </div>
                    <div class="recipe-details">
                        <div class="recipe-section">
                            <h3>Ingredients</h3>
                            <div class="ingredients-list">
                                ${ingredients.map(ing => `
                                    <div class="ingredient-item">
                                        <strong>${ing.ingredient}</strong><br>
                                        <span>${ing.measure}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="recipe-section">
                            <h3>Instructions</h3>
                            <div class="instructions">
                                ${meal.strInstructions.replace(/\n/g, '<br><br>')}
                            </div>
                        </div>
                        ${meal.strYoutube ? `
                            <div class="recipe-section">
                                <h3>Video Tutorial</h3>
                                <a href="${meal.strYoutube}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold;">
                                    📺 Watch on YouTube
                                </a>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                this.modal.style.display = 'block';
            }

            getIngredients(meal) {
                const ingredients = [];
                for (let i = 1; i <= 20; i++) {
                    const ingredient = meal[`strIngredient${i}`];
                    const measure = meal[`strMeasure${i}`];
                    
                    if (ingredient && ingredient.trim()) {
                        ingredients.push({
                            ingredient: ingredient.trim(),
                            measure: measure ? measure.trim() : ''
                        });
                    }
                }
                return ingredients;
            }

            showNoResults() {
                this.hideLoading();
                this.mealsContainer.style.display = 'none';
                this.noResults.style.display = 'block';
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            new MealExplorer();
        });
        