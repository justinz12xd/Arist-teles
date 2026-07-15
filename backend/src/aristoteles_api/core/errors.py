class AppError(Exception):
    """Base class for failures that have a stable public representation."""

    status_code = 500
    code = "internal_error"
    public_message = "Se produjo un error interno."

    def __init__(self, public_message: str | None = None) -> None:
        if public_message is not None:
            self.public_message = public_message
        super().__init__(self.public_message)


class InvalidInputError(AppError):
    status_code = 400
    code = "invalid_input"
    public_message = "La solicitud no es válida."


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"
    public_message = "No autorizado."


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"
    public_message = "El recurso no existe."


class IndexingConflictError(AppError):
    status_code = 409
    code = "indexing_conflict"
    public_message = "El documento ya se está indexando."


class InvalidModelOutputError(AppError):
    status_code = 502
    code = "invalid_model_output"
    public_message = "El proveedor devolvió una respuesta no válida."


class ProviderUnavailableError(AppError):
    status_code = 503
    code = "provider_unavailable"
    public_message = "El proveedor no está disponible."


class ProviderTimeoutError(AppError):
    status_code = 504
    code = "provider_timeout"
    public_message = "El proveedor excedió el tiempo de espera."


class RepositoryConflictError(Exception):
    """Internal signal for a repository uniqueness conflict."""
