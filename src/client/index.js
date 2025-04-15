setInterval(async () => {
    const data = await getState();
    const newPage = data;
    // Convert state name to page name as needed
    if (newPage === 'PLAYING') {
      newPage = 'sketch';
    } else if (newPage === 'IDLE') {
      newPage = 'idle';
    } else if (newPage === 'ONBOARDING') {
      newPage = 'onboarding';
    }
    
    // Only change if state has actually changed
    if (newPage.toLowerCase() !== currentPage) {
      console.log(`State change detected: ${currentPage || 'none'} -> ${newPage}`);
      unloadPage();
      currentPage = newPage.toLowerCase();
      loadPage(currentPage);
    }
  }, 1000);