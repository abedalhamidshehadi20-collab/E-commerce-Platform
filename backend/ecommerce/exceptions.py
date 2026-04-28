from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def _extract_first_error_message(payload):
    if isinstance(payload, list) and payload:
        return _extract_first_error_message(payload[0])

    if isinstance(payload, dict):
        if "detail" in payload:
            return _extract_first_error_message(payload["detail"])
        if "non_field_errors" in payload and payload["non_field_errors"]:
            return _extract_first_error_message(payload["non_field_errors"][0])
        for value in payload.values():
            extracted = _extract_first_error_message(value)
            if extracted:
                return extracted
        return ""

    if payload is None:
        return ""

    return str(payload)


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
        extracted_message = _extract_first_error_message(response.data)
        if extracted_message:
            message = extracted_message

    response.data = {"message": message, "errors": response.data}
    return response
