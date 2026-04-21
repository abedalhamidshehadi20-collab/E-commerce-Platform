from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {
                "message": "An unexpected server error occurred.",
                "errors": {"detail": ["Please try again later."]},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    message = "Request could not be processed."
    if isinstance(response.data, dict):
        if "detail" in response.data:
            message = str(response.data["detail"])
        elif "non_field_errors" in response.data and response.data["non_field_errors"]:
            message = str(response.data["non_field_errors"][0])

    response.data = {"message": message, "errors": response.data}
    return response
