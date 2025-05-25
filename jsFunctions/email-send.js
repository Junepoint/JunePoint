// email-send.js

const EMAILJS_PUBLIC_KEY = 'giyny2RB2kVNK0xtn';
const EMAILJS_SERVICE_ID = 'service_h2294eg';
const EMAILJS_TEMPLATE_ID = 'template_2q933xv';

// Strong regex for RFC 5322 compliant email addresses
function isValidEmail(email) {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email);
}

(function() {
  emailjs.init(EMAILJS_PUBLIC_KEY);
})();

document.addEventListener('DOMContentLoaded', function() {
  const forms = [
    { form: document.getElementById('contact-form'), status: document.getElementById('form-status') },
    { form: document.getElementById('emailjs-form'), status: document.getElementById('emailjs-status') }
  ];

  forms.forEach(({form, status}) => {
    if (form) {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (status) status.textContent = "";

        // Check reCAPTCHA
        const recaptchaWidget = form.querySelector('.g-recaptcha');
        if (recaptchaWidget) {
          const response = grecaptcha.getResponse();
          if (!response) {
            status.textContent = "Please complete the CAPTCHA to prove you're human.";
            return;
          }
        }

        // Email validation
        const emailInput = form.querySelector('input[name="user_email"]');
        const email = emailInput ? emailInput.value.trim() : "";
        if (!isValidEmail(email)) {
          status.textContent = "Please enter a valid email address.";
          emailInput.focus();
          return;
        }

        status.textContent = "Sending...";
        emailjs.sendForm(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          form
        ).then(function() {
          status.textContent = "Thank you! Your message has been sent.";
          form.reset();
          if (typeof grecaptcha !== "undefined") grecaptcha.reset(); // Reset CAPTCHA after send
        }, function(error) {
          status.textContent = "Oops, something went wrong. Please try again.";
          console.error('EmailJS error:', error);
        });
      });
    }
  });
});
