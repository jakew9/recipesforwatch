// Recipe Manager Application

(function() {
    'use strict';

    // Storage key for localStorage
    const STORAGE_KEY = 'recipes';

    // DOM Elements
    const recipeForm = document.getElementById('recipe-form');
    const formTitle = document.getElementById('form-title');
    const recipeIdInput = document.getElementById('recipe-id');
    const recipeNameInput = document.getElementById('recipe-name');
    const recipeIngredientsInput = document.getElementById('recipe-ingredients');
    const recipeStepsInput = document.getElementById('recipe-steps');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const recipeListSection = document.getElementById('recipe-list-section');
    const recipeList = document.getElementById('recipe-list');
    const recipeDetailSection = document.getElementById('recipe-detail-section');
    const detailTitle = document.getElementById('detail-title');
    const recipeDetail = document.getElementById('recipe-detail');
    const exportBtn = document.getElementById('export-btn');
    const backBtn = document.getElementById('back-btn');

    // State
    let recipes = [];

    // Initialize the app
    function init() {
        loadRecipes();
        renderRecipeList();
        bindEvents();
    }

    // Bind event listeners
    function bindEvents() {
        recipeForm.addEventListener('submit', handleFormSubmit);
        cancelBtn.addEventListener('click', resetForm);
        exportBtn.addEventListener('click', exportRecipes);
        backBtn.addEventListener('click', showList);
    }

    // Load recipes from localStorage
    function loadRecipes() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            recipes = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading recipes:', e);
            recipes = [];
        }
    }

    // Save recipes to localStorage
    function saveRecipes() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
        } catch (e) {
            console.error('Error saving recipes:', e);
        }
    }

    // Generate unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
    }

    // Parse ingredients from text (line-separated)
    function parseIngredients(text) {
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    // Parse steps from text (auto-detect numbered format)
    function parseSteps(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        return lines.map(line => {
            // Remove common numbering patterns: "1.", "1)", "1:", "Step 1:", "Step 1.", etc.
            return line
                .replace(/^(\d+[\.\)\:])\s*/, '')           // "1.", "1)", "1:"
                .replace(/^step\s*\d+[\.\)\:]?\s*/i, '')    // "Step 1:", "Step 1.", "Step 1"
                .replace(/^[\-\*\•]\s*/, '')                // "- ", "* ", "• "
                .trim();
        }).filter(step => step.length > 0);
    }

    // Handle form submission
    function handleFormSubmit(e) {
        e.preventDefault();

        const id = recipeIdInput.value || generateId();
        const name = recipeNameInput.value.trim();
        const ingredients = parseIngredients(recipeIngredientsInput.value);
        const steps = parseSteps(recipeStepsInput.value);

        if (!name || ingredients.length === 0 || steps.length === 0) {
            alert('Please fill in all fields with valid content.');
            return;
        }

        const recipe = { id, name, ingredients, steps };

        if (recipeIdInput.value) {
            // Update existing recipe
            const index = recipes.findIndex(r => r.id === id);
            if (index !== -1) {
                recipes[index] = recipe;
            }
        } else {
            // Add new recipe
            recipes.push(recipe);
        }

        saveRecipes();
        renderRecipeList();
        resetForm();
    }

    // Reset form to add mode
    function resetForm() {
        recipeForm.reset();
        recipeIdInput.value = '';
        formTitle.textContent = 'Add New Recipe';
        submitBtn.textContent = 'Add Recipe';
        cancelBtn.style.display = 'none';
    }

    // Render the recipe list
    function renderRecipeList() {
        if (recipes.length === 0) {
            recipeList.innerHTML = '<div class="empty-state">No recipes yet. Add your first recipe above!</div>';
            return;
        }

        recipeList.innerHTML = recipes.map(recipe => {
            const safeId = escapeHtml(recipe.id);
            return `
            <div class="recipe-item" data-id="${safeId}">
                <span class="recipe-item-name" onclick="viewRecipe('${safeId}')">${escapeHtml(recipe.name)}</span>
                <div class="recipe-item-actions">
                    <button type="button" class="btn btn-secondary btn-small" onclick="editRecipe('${safeId}')">Edit</button>
                    <button type="button" class="btn btn-danger btn-small" onclick="deleteRecipe('${safeId}')">Delete</button>
                </div>
            </div>
        `;
        }).join('');
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // View recipe details
    function viewRecipe(id) {
        const recipe = recipes.find(r => r.id === id);
        if (!recipe) return;

        detailTitle.textContent = recipe.name;
        recipeDetail.innerHTML = `
            <h3>Ingredients</h3>
            <ul>
                ${recipe.ingredients.map(ing => `<li>${escapeHtml(ing)}</li>`).join('')}
            </ul>
            <h3>Steps</h3>
            <ol>
                ${recipe.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
            </ol>
        `;

        recipeListSection.style.display = 'none';
        recipeDetailSection.style.display = 'block';
    }

    // Edit recipe
    function editRecipe(id) {
        const recipe = recipes.find(r => r.id === id);
        if (!recipe) return;

        recipeIdInput.value = recipe.id;
        recipeNameInput.value = recipe.name;
        recipeIngredientsInput.value = recipe.ingredients.join('\n');
        recipeStepsInput.value = recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');

        formTitle.textContent = 'Edit Recipe';
        submitBtn.textContent = 'Update Recipe';
        cancelBtn.style.display = 'inline-block';

        // Scroll to form
        document.getElementById('recipe-form-section').scrollIntoView({ behavior: 'smooth' });
    }

    // Delete recipe
    function deleteRecipe(id) {
        if (!confirm('Are you sure you want to delete this recipe?')) return;

        recipes = recipes.filter(r => r.id !== id);
        saveRecipes();
        renderRecipeList();
    }

    // Show recipe list (hide detail view)
    function showList() {
        recipeDetailSection.style.display = 'none';
        recipeListSection.style.display = 'block';
    }

    // Export recipes as JSON
    function exportRecipes() {
        const exportData = {
            recipes: recipes.map(r => ({
                id: r.id,
                name: r.name,
                ingredients: r.ingredients,
                steps: r.steps
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recipes.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Expose functions to global scope for onclick handlers
    window.viewRecipe = viewRecipe;
    window.editRecipe = editRecipe;
    window.deleteRecipe = deleteRecipe;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
