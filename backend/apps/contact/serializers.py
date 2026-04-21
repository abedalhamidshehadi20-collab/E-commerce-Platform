from rest_framework import serializers

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "subject", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        request = self.context["request"]
        if request.user.is_authenticated:
            validated_data["user"] = request.user
            validated_data.setdefault("name", request.user.full_name)
            validated_data.setdefault("email", request.user.email)
        return super().create(validated_data)
