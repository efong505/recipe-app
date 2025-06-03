document.addEventListener('click', function(event) {
  const target = event.target.closest('a');
  if (target && target.href.includes('recipe')) {
    event.preventDefault();
    const recipeUrl = target.href;
    const appUrl = `http://localhost:4200/recipe?url=${encodeURIComponent(recipeUrl)}`;
    window.open(appUrl, '_blank');
  }
});
