import re


def slugify(name: str, fallback: str = "app") -> str:
    """Lowercase, RFC-1123 and Docker-repository safe.

    Docker rejects repository names with uppercase or spaces ("invalid
    reference format") and Kubernetes rejects them as object names. One
    helper, so the image tag and the namespace cannot disagree.
    """
    slug = re.sub(r"[^a-z0-9-]", "-", name.lower())
    slug = re.sub(r"-{2,}", "-", slug).strip("-")[:40].strip("-")
    return slug or fallback