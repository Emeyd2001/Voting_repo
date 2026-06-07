# Voting System — Architecture Guide
# دليل هندسة نظام التصويت

---

## Table of Contents / فهرس المحتويات

- [EN — English Guide](#en--english-guide)
- [AR — الدليل بالعربية](#ar--الدليل-بالعربية)

---

---

# EN — English Guide

---

## 1. Project Overview

A **Django REST API** backend for an electronic voting system built for Mauritania.
Authentication is done via NNI (National ID Number) without a password — the system
auto-creates a voter account from a pre-seeded `CitizenRecord`.

**Tech stack:**

| Layer | Technology |
|---|---|
| Framework | Django 6 + Django REST Framework |
| Auth | JWT (SimpleJWT) — Bearer token |
| Database | SQLite (dev) → swap for PostgreSQL in prod |
| Image storage | Pillow + Django `MEDIA_ROOT` |

---

## 2. Project Structure

```
voting-system/
│
├── manage.py
├── requirements.txt
│
├── config/                  ← Django project settings
│   ├── settings.py
│   ├── urls.py              ← Root URL router
│   ├── asgi.py
│   └── wsgi.py
│
├── citizens/                ← Read-only citizen registry (seeded data)
│   ├── models.py            ← CitizenRecord model
│   ├── admin.py
│   └── migrations/
│
├── users/                   ← Authentication & user management
│   ├── models.py            ← Custom User (AbstractBaseUser)
│   ├── serializers.py       ← NNILoginSerializer, UserProfileSerializer
│   ├── services.py          ← AuthenticationService (business logic)
│   ├── permissions.py       ← IsAdmin, IsVoter
│   ├── views.py             ← NNILoginView
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
├── elections/               ← Election lifecycle management
│   ├── models.py            ← Election model + status choices
│   ├── serializers.py       ← ElectionAdminSerializer, ElectionPublicSerializer
│   ├── services.py          ← ElectionService (business logic)
│   ├── views.py             ← Admin & Public views
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
└── votes/                   ← (In progress) Vote recording
    ├── models.py
    ├── admin.py
    └── views.py
```

---

## 3. Architecture Patterns

### 3.1 — Service Layer Pattern ★ (most important)

> **Rule:** Views NEVER contain business logic. All logic lives in `services.py`.

```
Request → View → Service → Model → DB
                    ↑
              Validation,
              transactions,
              business rules
```

Each app that has logic has a `services.py` with a single service **class** containing
only `@staticmethod` methods:

```python
# elections/services.py
class ElectionService:
    @staticmethod
    @transaction.atomic
    def create_election(*, title, description, start_date, end_date):
        # validate → build model → save → return
        ...
```

**Why?**
- Views stay thin (easy to read)
- Business rules are reusable (can be called from admin, CLI, tests)
- `@transaction.atomic` wraps the whole operation safely

---

### 3.2 — Serializer Validation Pattern

Serializers do **two jobs**:
1. **Deserialize + validate** incoming request data
2. **Serialize** model instances to JSON for the response

```python
# In a view:
serializer = ElectionAdminSerializer(data=request.data)
serializer.is_valid(raise_exception=True)          # ← raises 400 automatically
election = ElectionService.create_election(**serializer.validated_data)
return Response(ElectionAdminSerializer(election).data, status=201)
```

Use **inheritance** for shared validation:

```python
class BaseElectionSerializer(serializers.ModelSerializer):
    def validate(self, attrs):   # shared cross-field validation
        ...

class ElectionAdminSerializer(BaseElectionSerializer):   # extends base
    ...

class ElectionPublicSerializer(serializers.ModelSerializer):  # independent
    ...
```

---

### 3.3 — Role-Based Permission Classes

Custom permissions live in `users/permissions.py` and are **reused across all apps**:

```python
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsVoter(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "voter"
```

Used in views:
```python
class AdminElectionListCreateView(APIView):
    permission_classes = [IsAdmin]   # only admins can access
```

---

### 3.4 — Custom User Model (AbstractBaseUser)

The project replaces Django's default `User` with a custom one that:
- Uses **NNI** (10-digit national ID) as the login field instead of email/username
- Adds `role`, `wilaya`, `phone_number`, `profile_image` fields
- Links to `CitizenRecord` via OneToOneField
- Auto-syncs citizen data on every save

```python
AUTH_USER_MODEL = 'users.User'   # set in settings.py
```

> **Rule:** Always set `AUTH_USER_MODEL` before the first migration. Changing it later is very hard.

---

### 3.5 — APIView-Based Views (Class-Based Views)

All views use DRF's `APIView` directly (not `ViewSet` or `GenericAPIView`).
This gives full control with a clean, explicit structure:

```python
class AdminElectionDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):    # GET /api/elections/admin/elections/<pk>/
        ...
    def put(self, request, pk):    # PUT
        ...
    def patch(self, request, pk):  # PATCH
        ...
```

---

### 3.6 — TextChoices Enums for Status Fields

Always use `models.TextChoices` for fields that have a fixed set of values:

```python
class ElectionStatusChoices(models.TextChoices):
    DRAFT     = "draft",     "Draft"
    SCHEDULED = "scheduled", "Scheduled"
    ACTIVE    = "active",    "Active"
    CLOSED    = "closed",    "Closed"
    ARCHIVED  = "archived",  "Archived"
```

Benefits: auto-validation, readable admin display, safe string comparisons in code.

---

### 3.7 — URL Namespacing (Per-App urls.py)

Each app has its own `urls.py`. The root `config/urls.py` includes them with a prefix:

```python
# config/urls.py
urlpatterns = [
    path('api/auth/',      include('users.urls')),
    path('api/elections/', include('elections.urls')),
]
```

```python
# elections/urls.py
urlpatterns = [
    path("admin/elections/",              AdminElectionListCreateView.as_view()),
    path("admin/elections/<int:pk>/",     AdminElectionDetailView.as_view()),
    path("admin/elections/<int:pk>/activate/", AdminElectionActivateView.as_view()),
    ...
    path("public/elections/",             PublicElectionListView.as_view()),
]
```

Full URL example: `POST /api/elections/admin/elections/5/activate/`

---

## 4. Authentication Flow

```
Client sends NNI
      ↓
NNILoginView (POST /api/auth/login/)
      ↓
NNILoginSerializer.validate_nni()       ← must be 10 digits
      ↓
AuthenticationService.login_with_nni()
      ↓
  CitizenRecord.objects.get(nni=nni)    ← must exist & be eligible
      ↓
  User.objects.get_or_create(nni=nni)   ← creates account if first login
      ↓
  RefreshToken.for_user(user)            ← issues JWT tokens
      ↓
Response: { user, access_token, refresh_token }
```

Subsequent requests: `Authorization: Bearer <access_token>`

---

## 5. Election Lifecycle (State Machine)

```
DRAFT ──activate──► SCHEDULED ──activate──► ACTIVE ──close──► CLOSED ──archive──► ARCHIVED
  ▲                     │
  └───deactivate─────────┘
```

| Transition | Method | Allowed from |
|---|---|---|
| activate | `ElectionService.activate_election` | DRAFT, SCHEDULED |
| deactivate | `ElectionService.deactivate_election` | SCHEDULED only |
| close | `ElectionService.close_election` | SCHEDULED, ACTIVE |
| archive | `ElectionService.archive_election` | CLOSED only |

---

## 6. Adding a New App — Checklist

When adding a new Django app (e.g. `candidates`), follow this structure:

```
candidates/
├── models.py        # Define model + TextChoices if needed
├── serializers.py   # At least one serializer per model
├── services.py      # CandidateService with @staticmethod methods
├── views.py         # APIView subclasses, thin, delegate to service
├── urls.py          # urlpatterns list
├── admin.py         # @admin.register(Model)
├── apps.py
└── migrations/
```

Then:
1. Add `'candidates'` to `INSTALLED_APPS` in `settings.py`
2. Add `path('api/candidates/', include('candidates.urls'))` in `config/urls.py`
3. Run `python manage.py makemigrations candidates`
4. Run `python manage.py migrate`

---

## 7. Key Rules to Follow

| # | Rule |
|---|---|
| 1 | **No logic in views** — delegate everything to the service layer |
| 2 | **Use `@transaction.atomic`** on any service method that writes to DB |
| 3 | **Use `raise_exception=True`** in `serializer.is_valid()` — never check manually |
| 4 | **Never call `save()` directly from a view** — always go through the service |
| 5 | **Set `AUTH_USER_MODEL`** before the first migration |
| 6 | **Use keyword-only args** (`*`) in service methods to prevent arg order bugs |
| 7 | **Use `TextChoices`** for any field with a fixed set of string values |

---

---

# AR — الدليل بالعربية

---

## ١. نظرة عامة على المشروع

هذا المشروع هو **واجهة برمجية REST** مبنية بـ Django لنظام تصويت إلكتروني خاص بموريتانيا.
المصادقة تتم عبر رقم الهوية الوطنية (NNI) دون كلمة مرور — النظام يُنشئ تلقائيًا حساب ناخب
من سجل المواطنين (`CitizenRecord`) المُخزَّن مسبقًا.

**المكدس التقني:**

| الطبقة | التقنية |
|---|---|
| الإطار | Django 6 + Django REST Framework |
| المصادقة | JWT (SimpleJWT) — Bearer token |
| قاعدة البيانات | SQLite (تطوير) → PostgreSQL في الإنتاج |
| تخزين الصور | Pillow + Django `MEDIA_ROOT` |

---

## ٢. هيكل المشروع

```
voting-system/
│
├── manage.py
├── requirements.txt
│
├── config/                  ← إعدادات Django (settings, urls الجذرية)
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── citizens/                ← سجل المواطنين (للقراءة فقط، بيانات مُحمَّلة مسبقًا)
│   ├── models.py            ← نموذج CitizenRecord
│   ├── admin.py
│   └── migrations/
│
├── users/                   ← المصادقة وإدارة المستخدمين
│   ├── models.py            ← مستخدم مخصص (AbstractBaseUser)
│   ├── serializers.py       ← NNILoginSerializer, UserProfileSerializer
│   ├── services.py          ← AuthenticationService (المنطق التجاري)
│   ├── permissions.py       ← IsAdmin, IsVoter
│   ├── views.py             ← NNILoginView
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
├── elections/               ← إدارة دورة حياة الانتخابات
│   ├── models.py            ← نموذج Election + حالات TextChoices
│   ├── serializers.py       ← ElectionAdminSerializer, ElectionPublicSerializer
│   ├── services.py          ← ElectionService (المنطق التجاري)
│   ├── views.py             ← واجهات المدير والعامة
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
│
└── votes/                   ← (قيد التطوير) تسجيل الأصوات
    ├── models.py
    ├── admin.py
    └── views.py
```

---

## ٣. أنماط هندسة البرمجيات المستخدمة

### ٣.١ — نمط طبقة الخدمة (Service Layer) ★ الأهم

> **القاعدة الذهبية:** الـ Views لا تحتوي أبدًا على منطق تجاري. كل المنطق يعيش في `services.py`.

```
الطلب ← View ← Service ← Model ← قاعدة البيانات
                   ↑
           التحقق، المعاملات،
           قواعد العمل
```

كل تطبيق (app) يحتوي على `services.py` بـ**كلاس واحد** يضم دوال `@staticmethod` فقط:

```python
# elections/services.py
class ElectionService:
    @staticmethod
    @transaction.atomic
    def create_election(*, title, description, start_date, end_date):
        # تحقق → أنشئ النموذج → احفظ → أرجع النتيجة
        ...
```

**لماذا هذا النمط؟**
- الـ Views تبقى بسيطة وسهلة القراءة
- قواعد العمل قابلة لإعادة الاستخدام (من الـ admin، CLI، الاختبارات)
- `@transaction.atomic` يحمي العملية بالكامل

---

### ٣.٢ — نمط التحقق عبر Serializers

الـ Serializers تقوم بـ**عملتين**:
1. **إلغاء التسلسل + التحقق** من بيانات الطلب القادم
2. **التسلسل** لتحويل نماذج قاعدة البيانات إلى JSON للاستجابة

```python
# داخل View:
serializer = ElectionAdminSerializer(data=request.data)
serializer.is_valid(raise_exception=True)   # ← يُرجع 400 تلقائيًا عند الخطأ
election = ElectionService.create_election(**serializer.validated_data)
return Response(ElectionAdminSerializer(election).data, status=201)
```

استخدم **الوراثة** للتحقق المشترك بين أكثر من serializer:

```python
class BaseElectionSerializer(serializers.ModelSerializer):
    def validate(self, attrs):   # تحقق مشترك بين الحقول
        ...

class ElectionAdminSerializer(BaseElectionSerializer):   # يرث من القاعدة
    ...
```

---

### ٣.٣ — أذونات مخصصة حسب الدور (Role-Based Permissions)

الأذونات المخصصة تعيش في `users/permissions.py` وتُستخدم في **جميع التطبيقات**:

```python
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsVoter(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "voter"
```

الاستخدام في الـ Views:
```python
class AdminElectionListCreateView(APIView):
    permission_classes = [IsAdmin]   # المدراء فقط
```

---

### ٣.٤ — نموذج مستخدم مخصص (AbstractBaseUser)

المشروع يستبدل نموذج `User` الافتراضي في Django بنموذج مخصص يستخدم:
- **NNI** (10 أرقام) كحقل تسجيل الدخول بدلًا من البريد/اسم المستخدم
- حقول إضافية: `role`, `wilaya`, `phone_number`, `profile_image`
- ارتباط بـ `CitizenRecord` عبر OneToOneField
- مزامنة تلقائية لبيانات المواطن عند كل حفظ

```python
# في settings.py — يجب الإعداد قبل أول migration
AUTH_USER_MODEL = 'users.User'
```

> **تحذير:** حدِّد `AUTH_USER_MODEL` قبل أول `migrate`، تغييره لاحقًا معقد جدًا.

---

### ٣.٥ — Views مبنية على APIView

جميع الـ Views ترث مباشرة من `APIView` (وليس `ViewSet` أو `GenericAPIView`)
لإعطاء تحكم كامل وبنية واضحة:

```python
class AdminElectionDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):    # GET
        ...
    def put(self, request, pk):    # PUT
        ...
    def patch(self, request, pk):  # PATCH
        ...
```

---

### ٣.٦ — TextChoices للحقول ذات القيم الثابتة

دائمًا استخدم `models.TextChoices` للحقول التي لها مجموعة محددة من القيم:

```python
class ElectionStatusChoices(models.TextChoices):
    DRAFT     = "draft",     "Draft"
    SCHEDULED = "scheduled", "Scheduled"
    ACTIVE    = "active",    "Active"
    CLOSED    = "closed",    "Closed"
    ARCHIVED  = "archived",  "Archived"
```

المزايا: تحقق تلقائي، عرض مقروء في الـ admin، مقارنات آمنة في الكود.

---

### ٣.٧ — توجيه URLs (urls.py لكل تطبيق)

كل تطبيق لديه `urls.py` خاص به. الـ `config/urls.py` الجذري يضمها مع بادئة:

```python
# config/urls.py
urlpatterns = [
    path('api/auth/',      include('users.urls')),
    path('api/elections/', include('elections.urls')),
]
```

مثال على URL كامل: `POST /api/elections/admin/elections/5/activate/`

---

## ٤. تدفق المصادقة

```
العميل يرسل رقم NNI
         ↓
NNILoginView  (POST /api/auth/login/)
         ↓
NNILoginSerializer.validate_nni()      ← يجب أن يكون 10 أرقام فقط
         ↓
AuthenticationService.login_with_nni()
         ↓
  CitizenRecord.objects.get(nni=nni)   ← يجب أن يوجد وأن يكون مؤهلًا
         ↓
  User.objects.get_or_create(nni=nni)  ← ينشئ حسابًا عند أول تسجيل دخول
         ↓
  RefreshToken.for_user(user)           ← يُصدر رمزَي JWT
         ↓
الاستجابة: { user, access_token, refresh_token }
```

الطلبات اللاحقة: `Authorization: Bearer <access_token>`

---

## ٥. دورة حياة الانتخابات (آلة الحالة)

```
DRAFT ──تفعيل──► SCHEDULED ──تفعيل──► ACTIVE ──إغلاق──► CLOSED ──أرشفة──► ARCHIVED
  ↑                   │
  └────إلغاء تفعيل────┘
```

| الانتقال | الدالة | مسموح من |
|---|---|---|
| activate | `ElectionService.activate_election` | DRAFT, SCHEDULED |
| deactivate | `ElectionService.deactivate_election` | SCHEDULED فقط |
| close | `ElectionService.close_election` | SCHEDULED, ACTIVE |
| archive | `ElectionService.archive_election` | CLOSED فقط |

---

## ٦. إضافة تطبيق جديد — قائمة المراجعة

عند إضافة تطبيق Django جديد (مثلًا `candidates`)، اتبع هذا الهيكل:

```
candidates/
├── models.py        # عرِّف النموذج + TextChoices إن لزم
├── serializers.py   # serializer واحد على الأقل لكل نموذج
├── services.py      # CandidateService بدوال @staticmethod
├── views.py         # فئات APIView رفيعة، تُفوِّض للـ service
├── urls.py          # قائمة urlpatterns
├── admin.py         # @admin.register(Model)
├── apps.py
└── migrations/
```

ثم:
1. أضف `'candidates'` إلى `INSTALLED_APPS` في `settings.py`
2. أضف `path('api/candidates/', include('candidates.urls'))` في `config/urls.py`
3. نفِّذ `python manage.py makemigrations candidates`
4. نفِّذ `python manage.py migrate`

---

## ٧. القواعد الأساسية

| # | القاعدة |
|---|---|
| ١ | **لا منطق في الـ Views** — فوِّض كل شيء لطبقة الخدمة |
| ٢ | **استخدم `@transaction.atomic`** في أي دالة service تكتب في قاعدة البيانات |
| ٣ | **استخدم `raise_exception=True`** في `serializer.is_valid()` دائمًا |
| ٤ | **لا تستدعِ `save()` مباشرة من الـ view** — اذهب دائمًا عبر الـ service |
| ٥ | **حدِّد `AUTH_USER_MODEL`** قبل أول migration |
| ٦ | **استخدم `*` في معاملات الـ service** لمنع أخطاء ترتيب الوسائط |
| ٧ | **استخدم `TextChoices`** لأي حقل له مجموعة ثابتة من القيم النصية |

---

## ٨. تشغيل المشروع لأول مرة / First-Time Setup

```bash
# 1. إنشاء بيئة افتراضية / Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. تثبيت المتطلبات / Install dependencies
pip install -r requirements.txt

# 3. تطبيق migrations / Apply migrations
python manage.py migrate

# 4. إنشاء مدير / Create superuser
python manage.py createsuperuser

# 5. تشغيل الخادم / Run server
python manage.py runserver
```

---

*Generated for the Mauritanian Electronic Voting System — PFE Project*
