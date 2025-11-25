// Recipe Manager App

// Storage key for localStorage
const STORAGE_KEY = 'recipes';

// DOM Elements
const recipeForm = document.getElementById('recipe-form');
const formTitle = document.getElementById('form-title');
const recipeIdInput = document.getElementById('recipe-id');
const recipeNameInput = document.getElementById('recipe-name');
const recipeIngredientsInput = document.getElementById('recipe-ingredients');
const recipeStepsInput = document.getElementById('recipe-steps');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const recipeList = document.getElementById('recipe-list');
const exportBtn = document.getElementById('export-btn');
const modal = document.getElementById('recipe-modal');
const modalRecipeName = document.getElementById('modal-recipe-name');
const modalIngredients = document.getElementById('modal-ingredients');
const modalSteps = document.getElementById('modal-steps');
const closeModalBtn = document.getElementById('close-modal');

// Initialize app
function init() {
    renderRecipeList();
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    recipeForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
    exportBtn.addEventListener('click', exportRecipes);
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Get all recipes from localStorage
function getRecipes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Save recipes to localStorage
function saveRecipes(recipes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Parse ingredients from text (line-separated)
function parseIngredients(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

// Parse steps from text (auto-detect numbered format or plain lines)
function parseSteps(text) {
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    return lines.map(line => {
        // Remove numbered prefixes like "1.", "2)", "1:", "Step 1:", etc.
        const cleanedLine = line
            .replace(/^(\d+[\.\)\:])\s*/, '')      // "1." "2)" "3:"
            .replace(/^(step\s*\d+[\.\)\:]?)\s*/i, '') // "Step 1:" "Step 2."
            .trim();
        return cleanedLine || line; // Return original if cleaning results in empty
    });
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const id = recipeIdInput.value || generateId();
    const name = recipeNameInput.value.trim();
    const ingredients = parseIngredients(recipeIngredientsInput.value);
    const steps = parseSteps(recipeStepsInput.value);

    if (!name || ingredients.length === 0 || steps.length === 0) {
        alert('Please fill in all fields');
        return;
    }

    const recipe = { id, name, ingredients, steps };
    const recipes = getRecipes();

    const existingIndex = recipes.findIndex(r => r.id === id);
    if (existingIndex >= 0) {
        recipes[existingIndex] = recipe;
    } else {
        recipes.push(recipe);
    }

    saveRecipes(recipes);
    renderRecipeList();
    resetForm();
}

// Reset form to add mode
function resetForm() {
    recipeForm.reset();
    recipeIdInput.value = '';
    formTitle.textContent = 'Add New Recipe';
    saveBtn.textContent = 'Save Recipe';
    cancelBtn.style.display = 'none';
}

// Edit recipe
function editRecipe(id) {
    const recipes = getRecipes();
    const recipe = recipes.find(r => r.id === id);

    if (!recipe) return;

    recipeIdInput.value = recipe.id;
    recipeNameInput.value = recipe.name;
    recipeIngredientsInput.value = recipe.ingredients.join('\n');
    recipeStepsInput.value = recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');

    formTitle.textContent = 'Edit Recipe';
    saveBtn.textContent = 'Update Recipe';
    cancelBtn.style.display = 'inline-block';

    // Scroll to form
    document.getElementById('recipe-form-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete recipe
function deleteRecipe(id) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    const recipes = getRecipes().filter(r => r.id !== id);
    saveRecipes(recipes);
    renderRecipeList();
}

// View recipe in modal
function viewRecipe(id) {
    const recipes = getRecipes();
    const recipe = recipes.find(r => r.id === id);

    if (!recipe) return;

    modalRecipeName.textContent = recipe.name;

    modalIngredients.innerHTML = recipe.ingredients
        .map(ing => `<li>${escapeHtml(ing)}</li>`)
        .join('');

    modalSteps.innerHTML = recipe.steps
        .map(step => `<li>${escapeHtml(step)}</li>`)
        .join('');

    modal.style.display = 'flex';
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render recipe list
function renderRecipeList() {
    const recipes = getRecipes();

    if (recipes.length === 0) {
        recipeList.innerHTML = '<div class="empty-state">No recipes yet. Add your first recipe above!</div>';
        return;
    }

    recipeList.innerHTML = recipes.map(recipe => `
        <div class="recipe-item" data-id="${recipe.id}">
            <span class="recipe-item-name" onclick="viewRecipe('${recipe.id}')">${escapeHtml(recipe.name)}</span>
            <div class="recipe-item-actions">
                <button class="btn btn-small btn-view" onclick="viewRecipe('${recipe.id}')">View</button>
                <button class="btn btn-small btn-edit" onclick="editRecipe('${recipe.id}')">Edit</button>
                <button class="btn btn-small btn-delete" onclick="deleteRecipe('${recipe.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Export recipes to JSON file
function exportRecipes() {
    const recipes = getRecipes();
    const exportData = { recipes };

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

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', init);
