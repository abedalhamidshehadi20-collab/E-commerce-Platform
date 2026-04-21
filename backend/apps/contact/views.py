from rest_framework import generics, permissions

from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactCreateAPIView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
