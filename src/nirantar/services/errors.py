class DomainError(Exception):
    """Base class for expected domain failures."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class ValidationDomainError(DomainError):
    """Raised when domain validation fails before or during persistence."""


class NotFoundError(DomainError):
    """Raised when a requested resource does not exist."""
