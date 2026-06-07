from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import NNILoginSerializer, UserProfileSerializer, UserAdminSerializer
from .services import AuthenticationService
from users.permissions import IsAdmin
from rest_framework.generics import RetrieveUpdateDestroyAPIView


# Login with NNI:

class NNILoginView(APIView):
    permission_classes = [AllowAny]

    # POST request to login with NNI:
    def post(self, request):
        serializer = NNILoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        auth_result = AuthenticationService.login_with_nni(serializer.validated_data["nni"])

        return Response(
            {
                "user": UserProfileSerializer(auth_result["user"], context={"request": request}).data,
                "access": auth_result["access"],
                "refresh": auth_result["refresh"],
            },
            status=status.HTTP_200_OK,
        )

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={"request": request})
        return Response(serializer.data)
    
class AdminUsersListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.all().order_by("-id")
        serializer = UserAdminSerializer(users, many=True)
        return Response(serializer.data)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserAdminSerializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserAdminSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserEligibilityView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if not user.citizen:
            return Response(
                {"error": "This user does not have a linked citizen record."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Toggle or explicitly set eligibility
        is_eligible = request.data.get("is_eligible")
        if is_eligible is not None:
            user.citizen.is_eligible = bool(is_eligible)
        else:
            user.citizen.is_eligible = not user.citizen.is_eligible
            
        user.citizen.save()
        
        serializer = UserAdminSerializer(user)
        return Response(serializer.data)