from django.conf import settings
from django.db import models


class ContactMessage(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        READ = "read", "Read"
        RESOLVED = "resolved", "Resolved"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="contact_messages",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "contact_messages"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["email"], name="idx_contact_email"),
            models.Index(fields=["status"], name="idx_contact_status"),
            models.Index(fields=["created_at"], name="idx_contact_created"),
        ]

    def __str__(self):
        return self.subject
