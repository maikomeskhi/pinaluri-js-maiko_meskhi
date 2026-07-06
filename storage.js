const Storage = {
  getSaved() {
    const raw = localStorage.getItem("rh_saved_recipes");
    return raw ? JSON.parse(raw) : [];
  },

  isSaved(id) {
    return this.getSaved().some((r) => r.id === id);
  },

  toggleSaved(recipe) {
    let saved = this.getSaved();
    const exists = saved.some((r) => r.id === recipe.id);

    if (exists) {
      saved = saved.filter((r) => r.id !== recipe.id);
    } else {
      saved.push(recipe);
    }

    localStorage.setItem("rh_saved_recipes", JSON.stringify(saved));
    return !exists;
  },

  removeSaved(id) {
    const saved = this.getSaved().filter((r) => r.id !== id);
    localStorage.setItem("rh_saved_recipes", JSON.stringify(saved));
  },

  getShoppingList() {
    const raw = localStorage.getItem("rh_shopping_list");
    return raw ? JSON.parse(raw) : [];
  },

  saveShoppingList(list) {
    localStorage.setItem("rh_shopping_list", JSON.stringify(list));
  },

  addShoppingItem(text) {
    const list = this.getShoppingList();
    list.push({ id: Date.now().toString(), text, done: false });
    this.saveShoppingList(list);
    return list;
  },

  addMultipleShoppingItems(items) {
    const list = this.getShoppingList();
    items.forEach((text) => {
      list.push({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        text,
        done: false,
      });
    });
    this.saveShoppingList(list);
    return list;
  },

  toggleShoppingItem(id) {
    const list = this.getShoppingList().map((item) =>
      item.id === id ? { ...item, done: !item.done } : item,
    );
    this.saveShoppingList(list);
    return list;
  },

  removeShoppingItem(id) {
    const list = this.getShoppingList().filter((item) => item.id !== id);
    this.saveShoppingList(list);
    return list;
  },
};
