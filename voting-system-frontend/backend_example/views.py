from django.utils import translation
from django.utils.translation import gettext as _
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

# If you use Simple JWT
try:
    from rest_framework_simplejwt.tokens import RefreshToken
    HAS_SIMPLE_JWT = True
except Exception:
    HAS_SIMPLE_JWT = False


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/login/ { "nni": "123456" }

    Reads Accept-Language header and activates the language for the request.
    If user with given NNI exists, returns a token and user info; otherwise returns
    translated error messages.
    """
    accept_lang = request.headers.get('Accept-Language', 'en')
    lang = accept_lang.split(',')[0].split('-')[0]
    translation.activate(lang)

    nni = (request.data.get('nni') or '').strip()
    if not nni:
        return Response({'detail': _('Invalid NNI')}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    try:
        user = User.objects.get(nni=nni)
    except User.DoesNotExist:
        return Response({'detail': _('User not found')}, status=status.HTTP_404_NOT_FOUND)

    # In passwordless flow we assume possession of NNI is sufficient.
    # Customize token generation to your auth stack.
    if HAS_SIMPLE_JWT:
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
    else:
        # Fallback: return a dummy token (replace with your token logic)
        access = 'token-for-user-{}'.format(user.id)

    user_data = {
        'id': user.id,
        'username': getattr(user, 'username', ''),
        'role': getattr(user, 'role', 'voter'),
    }

    return Response({'token': access, 'user': user_data}, status=status.HTTP_200_OK)
