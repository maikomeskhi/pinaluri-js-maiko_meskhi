const API_BASE = "https://www.themealdb.com/api/json/v1/1";

let selectedCategories = new Set();
let searchTimeout = null;
let currentRecipes = [];
const categoriesGrid = document.getElementById("categories-grid");
const filterBar = document.getElementById("filter-bar");
const recipesGrid = document.getElementById("recipes-grid");
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-filters");
const navCategories = document.getElementById("nav-categories");

const modal = document.getElementById("recipe-modal");
const modalContent = document.getElementById("modal-content");
const modalClose = document.getElementById("modal-close");

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  fetchByLetter("a");

  searchInput.addEventListener("input", onSearchInput);
  clearBtn.addEventListener("click", clearAllFilters);

  initTabs();
  renderSavedRecipes();
  renderShoppingList();
  document
    .getElementById("shopping-form")
    .addEventListener("submit", handleAddItem);
  document
    .getElementById("clear-done-btn")
    .addEventListener("click", clearCompletedItems);

  initModalClosing();
  initScrollspy();
  initNewsletter();
});

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories.php`);
    const data = await res.json();
    const categories = data.categories;

    categoriesGrid.innerHTML = categories
      .slice(0, 8)
      .map(
        (cat) => `
        <div class="recipe-card" data-category-card="${cat.strCategory}" style="cursor:pointer;">
          <img src="${cat.strCategoryThumb}" alt="${cat.strCategory}" loading="lazy">
          <div class="card-body">
            <span class="tag">კატეგორია</span>
            <h3>${cat.strCategory}</h3>
          </div>
        </div>`,
      )
      .join("");

    categoriesGrid.querySelectorAll("[data-category-card]").forEach((card) => {
      card.addEventListener("click", () => {
        selectSingleCategoryAndScroll(card.dataset.categoryCard);
      });
    });

    filterBar.innerHTML = categories
      .map(
        (cat) =>
          `<button class="filter-chip" data-category="${cat.strCategory}">${cat.strCategory}</button>`,
      )
      .join("");

    filterBar.querySelectorAll(".filter-chip").forEach((chip) => {
      chip.addEventListener("click", () => toggleCategory(chip));
    });

    const navItems = categories
      .slice(0, 6)
      .map(
        (cat) =>
          `<li><a href="#recipes" data-category="${cat.strCategory}">${cat.strCategory}</a></li>`,
      )
      .join("");
    navCategories.insertAdjacentHTML("beforeend", navItems);

    navCategories.querySelectorAll("a[data-category]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        selectSingleCategoryAndScroll(link.dataset.category);

        document.querySelector(".burger")?.classList.remove("open");
        document.querySelector(".main-nav")?.classList.remove("open");
      });
    });
  } catch (error) {
    categoriesGrid.innerHTML = `<div class="empty-state">
      <span class="font-hand">ვაი, რაღაც არასწორად წავიდა 🙈</span>
      კატეგორიების ჩატვირთვა ვერ მოხერხდა.
    </div>`;
    console.error("Categories fetch failed:", error);
  }
}

function selectSingleCategoryAndScroll(categoryName) {
  searchInput.value = "";
  selectedCategories.clear();
  selectedCategories.add(categoryName);

  filterBar.querySelectorAll(".filter-chip").forEach((c) => {
    c.classList.toggle("active", c.dataset.category === categoryName);
  });

  renderRecipes();
  document.getElementById("recipes").scrollIntoView({ behavior: "smooth" });
}

function toggleCategory(chip) {
  const category = chip.dataset.category;
  searchInput.value = "";

  if (selectedCategories.has(category)) {
    selectedCategories.delete(category);
    chip.classList.remove("active");
  } else {
    selectedCategories.add(category);
    chip.classList.add("active");
  }

  selectedCategories.size ? renderRecipes() : fetchByLetter("a");
}

function clearAllFilters() {
  selectedCategories.clear();
  searchInput.value = "";
  filterBar
    .querySelectorAll(".filter-chip")
    .forEach((c) => c.classList.remove("active"));
  fetchByLetter("a");
}

function onSearchInput() {
  clearTimeout(searchTimeout);
  const query = searchInput.value.trim();

  searchTimeout = setTimeout(async () => {
    if (query.length === 0) {
      selectedCategories.size ? renderRecipes() : fetchByLetter("a");
      return;
    }

    filterBar
      .querySelectorAll(".filter-chip")
      .forEach((c) => c.classList.remove("active"));
    selectedCategories.clear();

    recipesGrid.innerHTML = '<div class="loader">ვეძებთ...</div>';
    try {
      const res = await fetch(
        `${API_BASE}/search.php?s=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      renderGrid(data.meals);
    } catch (error) {
      recipesGrid.innerHTML =
        '<div class="empty-state">ძებნისას მოხდა შეცდომა.</div>';
      console.error(error);
    }
  }, 400);
}

async function fetchByLetter(letter) {
  recipesGrid.innerHTML = '<div class="loader">იტვირთება რეცეპტები...</div>';
  try {
    const res = await fetch(`${API_BASE}/search.php?f=${letter}`);
    const data = await res.json();
    renderGrid(data.meals);
  } catch (error) {
    recipesGrid.innerHTML =
      '<div class="empty-state">რეცეპტების ჩატვირთვა ვერ მოხერხდა.</div>';
    console.error(error);
  }
}

async function renderRecipes() {
  recipesGrid.innerHTML = '<div class="loader">იტვირთება რეცეპტები...</div>';

  try {
    const requests = Array.from(selectedCategories).map((cat) =>
      fetch(`${API_BASE}/filter.php?c=${encodeURIComponent(cat)}`).then((r) =>
        r.json(),
      ),
    );

    const results = await Promise.all(requests);
    const merged = [];
    const seenIds = new Set();

    results.forEach((data) => {
      (data.meals || []).forEach((meal) => {
        if (!seenIds.has(meal.idMeal)) {
          seenIds.add(meal.idMeal);
          merged.push(meal);
        }
      });
    });

    renderGrid(merged);
  } catch (error) {
    recipesGrid.innerHTML =
      '<div class="empty-state">რეცეპტების ჩატვირთვა ვერ მოხერხდა.</div>';
    console.error(error);
  }
}

function renderGrid(meals) {
  currentRecipes = meals || [];

  if (!meals || meals.length === 0) {
    recipesGrid.innerHTML = `<div class="empty-state">
      <span class="font-hand">ვერაფერი ვიპოვეთ 🍂</span>
      სცადე სხვა საძიებო სიტყვა ან კატეგორია.
    </div>`;
    return;
  }

  recipesGrid.innerHTML = meals
    .map((meal) => {
      const isSaved = Storage.isSaved(meal.idMeal);
      return `
      <div class="recipe-card" data-id="${meal.idMeal}">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy" style="cursor:pointer;">
        <div class="card-body">
          <span class="tag">კერძი</span>
          <h3 style="cursor:pointer;">${meal.strMeal}</h3>
          <div class="card-footer">
            <button class="btn btn-sage view-btn" style="padding:8px 14px; font-size:.85rem;">ნახვა</button>
            <button class="save-btn ${isSaved ? "saved" : ""}" data-id="${meal.idMeal}" aria-label="შენახვა">
              ${isSaved ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  recipesGrid.querySelectorAll(".recipe-card").forEach((card) => {
    const id = card.dataset.id;
    card.querySelector("img").addEventListener("click", () => openModal(id));
    card.querySelector("h3").addEventListener("click", () => openModal(id));
    card
      .querySelector(".view-btn")
      .addEventListener("click", () => openModal(id));
  });

  recipesGrid.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleSaveClick(btn, meals));
  });
}

function handleSaveClick(btn, meals) {
  const id = btn.dataset.id;
  const meal = meals.find((m) => m.idMeal === id);

  const nowSaved = Storage.toggleSaved({
    id: meal.idMeal,
    name: meal.strMeal,
    image: meal.strMealThumb,
  });

  btn.classList.toggle("saved", nowSaved);
  btn.textContent = nowSaved ? "♥" : "♡";
  renderSavedRecipes();
}

async function openModal(id) {
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  modalContent.innerHTML = `<button class="modal-close" id="modal-close">✕</button><div class="loader">იტვირთება რეცეპტი...</div>`;
  bindModalClose();

  try {
    const res = await fetch(`${API_BASE}/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals ? data.meals[0] : null;

    if (!meal) {
      modalContent.innerHTML = `<button class="modal-close" id="modal-close">✕</button><div class="empty-state">რეცეპტი ვერ მოიძებნა.</div>`;
      bindModalClose();
      return;
    }

    renderModalContent(meal);
  } catch (error) {
    modalContent.innerHTML = `<button class="modal-close" id="modal-close">✕</button><div class="empty-state">რეცეპტის ჩატვირთვა ვერ მოხერხდა.</div>`;
    bindModalClose();
    console.error(error);
  }
}

function buildIngredientsList(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (name && name.trim() !== "") {
      ingredients.push({
        name: name.trim(),
        measure: measure ? measure.trim() : "",
      });
    }
  }
  return ingredients;
}

function renderModalContent(meal) {
  const ingredients = buildIngredientsList(meal);
  const isSaved = Storage.isSaved(meal.idMeal);

  const ingredientsHTML = ingredients
    .map(
      (ing) =>
        `<div class="ingredient-tag"><span class="amount">${ing.measure}</span>${ing.name}</div>`,
    )
    .join("");

  const videoHTML = meal.strYoutube
    ? `<div class="video-embed">
        <h3 style="margin-bottom:14px;">ვიდეო ინსტრუქცია</h3>
        <iframe src="${meal.strYoutube.replace("watch?v=", "embed/")}" allowfullscreen></iframe>
      </div>`
    : "";

  modalContent.innerHTML = `
    <button class="modal-close" id="modal-close" aria-label="დახურვა">✕</button>
    <div class="modal-detail-wrap">
      <div>
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      </div>
      <div>
        <h2 class="font-display">${meal.strMeal}</h2>
        <div class="detail-meta">
          <span>🍽️ ${meal.strCategory || "უცნობი"}</span>
          <span>🌍 ${meal.strArea || "უცნობი"}</span>
        </div>

        <div class="detail-actions">
          <button class="btn ${isSaved ? "btn-primary" : "btn-outline"}" id="modal-save-btn">
            ${isSaved ? "♥ შენახულია" : "♡ შენახვა"}
          </button>
          <button class="btn btn-sage" id="modal-shopping-btn">
            🛒 ინგრედიენტების დამატება სიაში
          </button>
        </div>

        <h3 style="margin-top:26px;">ინგრედიენტები</h3>
        <div class="ingredients-list">${ingredientsHTML}</div>

        <h3 style="margin-top:26px;">მომზადების ინსტრუქცია</h3>
        <p class="instructions">${meal.strInstructions}</p>

        ${videoHTML}
      </div>
    </div>
  `;

  bindModalClose();

  document.getElementById("modal-save-btn").addEventListener("click", (e) => {
    const nowSaved = Storage.toggleSaved({
      id: meal.idMeal,
      name: meal.strMeal,
      image: meal.strMealThumb,
    });
    e.target.textContent = nowSaved ? "♥ შენახულია" : "♡ შენახვა";
    e.target.classList.toggle("btn-primary", nowSaved);
    e.target.classList.toggle("btn-outline", !nowSaved);
    renderSavedRecipes();
    renderGrid(currentRecipes); // recipes grid-ის heart icon-ებიც განახლდეს
  });

  document
    .getElementById("modal-shopping-btn")
    .addEventListener("click", (e) => {
      const items = ingredients.map(
        (ing) => `${ing.name}${ing.measure ? " — " + ing.measure : ""}`,
      );
      Storage.addMultipleShoppingItems(items);
      renderShoppingList();
      e.target.textContent = "✓ დამატებულია!";
      setTimeout(() => {
        e.target.textContent = "🛒 ინგრედიენტების დამატება სიაში";
      }, 1800);
    });
}

function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

function bindModalClose() {
  document.getElementById("modal-close")?.addEventListener("click", closeModal);
}

function initModalClosing() {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(); // overlay-ზე დაჭერით დახურვა
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });
}
function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document
        .querySelectorAll(".tab-panel")
        .forEach((panel) => panel.classList.remove("active"));
      document
        .getElementById(`panel-${btn.dataset.tab}`)
        .classList.add("active");
    });
  });
}

function renderSavedRecipes() {
  const grid = document.getElementById("saved-grid");
  const saved = Storage.getSaved();

  if (saved.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <span class="font-hand">ჯერ არაფერია შენახული 🤍</span>
      <p style="margin-bottom:20px;">დაათვალიერე რეცეპტები და დააჭირე გულს რომელიც მოგეწონება.</p>
      <a href="#recipes" class="btn btn-outline">რეცეპტების ნახვა</a>
    </div>`;
    return;
  }

  grid.innerHTML = saved
    .map(
      (r) => `
      <div class="recipe-card" data-id="${r.id}">
        <img src="${r.image}" alt="${r.name}" loading="lazy" style="cursor:pointer;">
        <div class="card-body">
          <span class="tag">შენახული</span>
          <h3 style="cursor:pointer;">${r.name}</h3>
          <div class="card-footer">
            <button class="btn btn-sage view-btn" style="padding:8px 14px; font-size:.85rem;">ნახვა</button>
            <button class="save-btn saved" data-id="${r.id}" aria-label="ამოშლა">♥</button>
          </div>
        </div>
      </div>`,
    )
    .join("");

  grid.querySelectorAll(".recipe-card").forEach((card) => {
    const id = card.dataset.id;
    card.querySelector("img").addEventListener("click", () => openModal(id));
    card.querySelector("h3").addEventListener("click", () => openModal(id));
    card
      .querySelector(".view-btn")
      .addEventListener("click", () => openModal(id));
  });

  grid.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      Storage.removeSaved(btn.dataset.id);
      renderSavedRecipes();
      renderGrid(currentRecipes);
    });
  });
}

function handleAddItem(e) {
  e.preventDefault();
  const input = document.getElementById("shopping-input");
  const text = input.value.trim();
  if (text === "") return;
  Storage.addShoppingItem(text);
  input.value = "";
  renderShoppingList();
}

function renderShoppingList() {
  const list = document.getElementById("shopping-list");
  const items = Storage.getShoppingList();
  const countLabel = document.getElementById("shopping-count");
  countLabel.textContent = `${items.length} პროდუქტი`;

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <span class="font-hand">სია ცარიელია 📝</span>
      დაამატე პირველი პროდუქტი ზემოთა ველიდან.
    </div>`;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
      <div class="shopping-item ${item.done ? "done" : ""}" data-id="${item.id}">
        <input type="checkbox" ${item.done ? "checked" : ""}>
        <span>${item.text}</span>
        <button class="remove-btn" aria-label="წაშლა">✕</button>
      </div>`,
    )
    .join("");

  list.querySelectorAll(".shopping-item").forEach((row) => {
    const id = row.dataset.id;
    row
      .querySelector('input[type="checkbox"]')
      .addEventListener("change", () => {
        Storage.toggleShoppingItem(id);
        renderShoppingList();
      });
    row.querySelector(".remove-btn").addEventListener("click", () => {
      Storage.removeShoppingItem(id);
      renderShoppingList();
    });
  });
}

function clearCompletedItems() {
  const remaining = Storage.getShoppingList().filter((item) => !item.done);
  Storage.saveShoppingList(remaining);
  renderShoppingList();
}

function initNewsletter() {
  const form = document.getElementById("newsletter-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("newsletter-email");
    const email = emailInput.value.trim();
    if (!email) return;

    const subscribers = JSON.parse(
      localStorage.getItem("rh_newsletter_emails") || "[]",
    );
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      localStorage.setItem("rh_newsletter_emails", JSON.stringify(subscribers));
    }

    form.outerHTML = `<div class="newsletter-success">🎉 მადლობა! <strong>${email}</strong> დამატებულია გამომწერების სიაში.</div>`;
  });
}

function initScrollspy() {
  const sections = document.querySelectorAll("main > section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.dataset.section === entry.target.id,
            );
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );

  sections.forEach((section) => observer.observe(section));
}
