// assets/js/contact.js

// 1. Dynamic Form Fields Based on Purpose
const dynamicMap = {
    research: `
      <label for="institution">Institution</label>
      <input id="institution" name="institution" required>
    `,
    social: `
      <label for="organization">Organization</label>
      <input id="organization" name="organization" required>
    `,
    tech: `
      <label for="company">Company/Project</label>
      <input id="company" name="company" required>
    `
  };
  
  const purposeSelect = document.getElementById('purpose');
  const dynamicFieldsContainer = document.getElementById('dynamicFields');
  
  purposeSelect.addEventListener('change', (e) => {
    dynamicFieldsContainer.innerHTML = dynamicMap[e.target.value] || '';
  });
  
  
  // 2. Chatbot Toggle (Stub for Future Integration)
  const chatbotToggle = document.getElementById('chatbotToggle');
  chatbotToggle.addEventListener('click', (e) => {
    e.preventDefault();
    // TODO: Integrate real chatbot widget here
    alert('Chatbot feature will be available soon!');
  });
  
  
  // 3. Office Map Switcher
  const officeLocations = {
    india: 'https://maps.google.com/maps?q=Bangalore&t=&z=13&ie=UTF8&iwloc=&output=embed',
    cameroon: 'https://maps.google.com/maps?q=Yaound%C3%A9&t=&z=13&ie=UTF8&iwloc=&output=embed'
  };
  
  document.querySelectorAll('.office-panel button').forEach(btn => {
    btn.addEventListener('click', () => {
      const office = btn.dataset.office;
      const url = officeLocations[office];
      const mapContainer = document.getElementById('mapContainer');
      mapContainer.innerHTML = `<iframe src="${url}" allowfullscreen></iframe>`;
    });
  });
  
  
  // 4. AJAX Form Submission via Fetch to Formspree
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
  
    const formData = new FormData(form);
  
    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: { 'Accept': 'application/json' }
      });
  
      if (!response.ok) throw new Error('Network response was not OK');
  
      // Success feedback
      alert('Thank you! Your message has been sent.');
      form.reset();
      dynamicFieldsContainer.innerHTML = '';
    } catch (err) {
      console.error('Form submission error:', err);
      alert('Oops! There was a problem sending your message.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
  