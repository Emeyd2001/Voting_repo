Django example: Login API with Accept-Language support

Files:
- `views.py`: example DRF view `login_view` that reads `Accept-Language`, activates the language, and returns translated error messages or a token.
- `urls.py`: example URL route for the endpoint.

Setup notes:

1. settings.py

   - Ensure i18n is enabled:

     USE_I18N = True
     LANGUAGES = [('en','English'), ('fr','Français'), ('ar','العربية')]
     LOCALE_PATHS = [BASE_DIR / 'locale']

   - Make sure `django.middleware.locale.LocaleMiddleware` is in `MIDDLEWARE` (after SessionMiddleware).

2. Translations

   - Add translation strings (the view uses `Invalid NNI` and `User not found`).
   - Create message files:

     django-admin makemessages -l fr
     django-admin makemessages -l ar

   - Edit the generated `locale/<lang>/LC_MESSAGES/django.po` and translate messages.
   - Compile:

     django-admin compilemessages

3. Authentication

   - The example uses `rest_framework_simplejwt` if installed to generate access tokens.
   - Install and configure Simple JWT if you want real JWT tokens.

4. Notes on Accept-Language

   - The frontend should send `Accept-Language` header (e.g., `en`, `fr`, `ar`). The interceptor in the frontend already does this.
   - The backend activates the requested language for the duration of the view using `translation.activate(lang)`.
