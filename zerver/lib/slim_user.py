from dataclasses import dataclass
from typing import List

from django.db.models.query import QuerySet

from zerver.models import UserProfile


@dataclass(frozen=True)
class SlimRealm:
    id: int
    deactivated: bool
    host: str


@dataclass(frozen=True)
class SlimUser:
    id: int
    realm: SlimRealm
    realm_id: int
    recipient_id: int
    email: str
    is_bot: bool
    is_active: bool
    is_mirror_dummy: bool
    default_language: str


SLIM_FIELDS = [
    "id",
    "realm__deactivated",
    "realm__string_id",
    "realm_id",
    "recipient_id",
    "email",
    "is_bot",
    "is_active",
    "is_mirror_dummy",
    "default_language",
]


def slimmify(user: UserProfile) -> SlimUser:
    slim_realm = SlimRealm(
        id=user.realm_id, deactivated=user.realm.deactivated, host=user.realm.host
    )

    slim_user = SlimUser(
        id=user.id,
        realm=slim_realm,
        realm_id=user.realm_id,
        recipient_id=user.recipient_id,
        email=user.email,
        is_bot=user.is_bot,
        is_active=user.is_active,
        is_mirror_dummy=user.is_mirror_dummy,
        default_language=user.default_language,
    )

    return slim_user


def get_slim_users(query: QuerySet) -> List[SlimUser]:
    # Timings here were taken on the same machine for
    # the operation of adding 5000 users to a new stream.
    # I took many samples and turned off garbage collection.

    # Adding `only(*SLIM_FIELDS)` here reduces db time (as measured by db.py) from
    # ~130ms to ~35ms. Overall time to produce the list drops from
    # ~660ms to ~440ms.
    users = list(query.select_related("realm").only(*SLIM_FIELDS))

    # This step takes ~50ms, and then all SlimUser fields take
    # less than a microsecond to access.
    slim_users = [slimmify(user) for user in users]

    return slim_users
