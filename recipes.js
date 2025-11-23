//Hamburger menu toggle
const hamburger = document.querySelector(".hamburger-menu");
const menu = document.querySelector(".menu");

hamburger.addEventListener("click", () => {
  menu.classList.toggle("active");
});

//Alert
function showAlert(type, message) {
  const box = document.createElement("div");
  box.className = `alert ${type}`;
  box.textContent = message;

  document.body.prepend(box);

  setTimeout(() => {
    box.style.opacity = "0";
    box.style.transform = "translateY(-6px)";
    setTimeout(() => box.remove(), 300);
  }, 2500);
}

//Confirm
function showConfirm(message) {
  return new Promise((resolve) => {
    const wrapper = document.createElement("div");
    wrapper.className = "confirm-wrapper";

    wrapper.innerHTML = `
      <div class="confirm-box">
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="yesBtn">YES</button>
          <button class="noBtn">NO</button>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    wrapper.querySelector(".yesBtn").onclick = () => {
      wrapper.remove();
      resolve(true);
    };

    wrapper.querySelector(".noBtn").onclick = () => {
      wrapper.remove();
      resolve(false);
    };
  });
}

//Get recipes from localStorage
let recipes = JSON.parse(localStorage.getItem("myRecipes")) || [];

//Display function
function displayRecipeCard(recipe) {
  const container = document.getElementById("results");
  if (!container) return;

  const card = document.createElement("div");
  card.classList.add("recipe-card");
  card.dataset.id = recipe.id;

  card.innerHTML = `
    <h2 class="name">${recipe.name}</h2>
    <img src="${recipe.image}" class="image">
    <h3 class="labelIng">Ingredients</h3>
    <ul class="ingredients">${recipe.ingredients
      ?.map((i) => `<li>${i}</li>`)
      .join("")}</ul>
    <h3 class="labelInt">Instructions</h3>
    <ol class="instructions">${recipe.instructions
      ?.map((i) => `<li>${i}</li>`)
      .join("")}</ol>
    <button class="deleteBtn">DELETE RECIPE</button>
  `;

  //Delete btn
  const deleteBtn = card.querySelector(".deleteBtn");

  deleteBtn.addEventListener("click", async () => {
    const ok = await showConfirm("Are you sure?");
    if (!ok) return;

    const id = recipe.id;

    //Local delete
    const isLocal = recipes.some((r) => r.id === id);
    if (isLocal) {
      recipes = recipes.filter((r) => r.id !== id);
      localStorage.setItem("myRecipes", JSON.stringify(recipes));
      card.remove();
      showAlert("success", "Recipe deleted");
      return;
    }

    //API delete
    try {
      const res = await fetch(`https://dummyjson.com/recipes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete API recipe");

      showAlert("success", "Recipe deleted");
      card.remove();
    } catch (err) {
      console.error(err);
      showAlert("error", "Failed to delete recipe");
    }
  });

  container.appendChild(card);
}

//Search function
async function fetchRecipe() {
  const searchbar = document.getElementById("searchbar").value.toLowerCase();
  const container = document.getElementById("results");

  container.innerHTML = "";

  try {
    const response = await fetch(
      `https://dummyjson.com/recipes/search?q=${searchbar}`
    );

    if (!response.ok) {
      throw new Error("Network error");
    }

    const data = await response.json();

    const localRecipes = recipes.filter((r) =>
      r.name.toLowerCase().includes(searchbar)
    );

    const allResults = [...localRecipes, ...data.recipes];

    if (allResults.length === 0) {
      showAlert("info", "No recipes found");
      return;
    }

    allResults.forEach(displayRecipeCard);
  } catch (err) {
    console.error(err);
    showAlert("error", "Error fetching recipes");
  }
}

//Search btn
const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
  searchBtn.addEventListener("click", fetchRecipe);
}

//Add function
const form = document.getElementById("addRecipe");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("recipeName").value;
    const image = document.getElementById("recipeImage").value;
    const ingredients = document
      .getElementById("recipeIngredients")
      .value.split("\n")
      .map((i) => i.trim());
    const instructions = document
      .getElementById("recipeInstructions")
      .value.split("\n")
      .map((i) => i.trim());

    try {
      const res = await fetch("https://dummyjson.com/recipes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          image,
          ingredients,
          instructions,
        }),
      });

      if (!res.ok) throw new Error("Failed to add recipe");

      const newRecipe = await res.json();

      if (!newRecipe.id) newRecipe.id = Date.now();

      recipes.unshift(newRecipe);
      localStorage.setItem("myRecipes", JSON.stringify(recipes));

      displayRecipeCard(newRecipe);

      showAlert("success", `Recipe "${newRecipe.name}" created!`);
      form.reset();
    } catch (err) {
      console.error(err);
      showAlert("error", "Could not add recipe");
    }
  });
}

//Show all recipes
fetchRecipe();
