from __future__ import absolute_import
from __future__ import print_function

from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError

import os
import shutil
import tempfile
import ujson

from zerver.lib.export import do_export_realm
from zerver.models import get_realm

class Command(BaseCommand):
    help = """Exports all data from a Zulip realm

    This command exports all significant data from a Zulip.  The
    result can be imported using the `./manage.py import` command.

    Things that are exported:
    * All user-accessible data in the Zulip database (Messages,
      Streams, UserMessages, RealmEmoji, etc.)
    * Copies of all uploaded files and avatar images along with
      metadata needed to restore them even in the ab

    Things that are not exported:
    * Confirmation, MitUser, and PreregistrationUser (transient tables)
    * Sessions (everyone will need to login again post-export)
    * Users' passwords and API keys (users will need to use SSO or reset password)
    * Mobile tokens for APNS/GCM (users will need to reconnect their mobile devices)
    * UserActivity and UserActivityInternal (lower-value analytics data)
    * ScheduledJob (Not relevant on a new server)
    * Referral (Unused)
    * Deployment (Unused)
    * third_party_api_results cache (this means rerending all old
      messages could be expensive)

    Performance: In one test, the tool exported a realm with hundreds
    of users and ~1M messages of history in about 3 hours of serial
    runtime.  Importing that same data set took about 30 minutes.  But
    this will vary a lot depending on the average number of recipients
    of messages in the realm, hardware, etc."""

    def add_arguments(self, parser):
        parser.add_argument('realm', metavar='<realm>', type=str,
                            help="realm to export")
        parser.add_argument('--output',
                            dest='output_dir',
                            action="store",
                            default=None,
                            help='Directory to write exported data to.')

    def handle(self, *args, **options):
        try:
            realm = get_realm(options["realm"])
        except ValidationError:
            raise CommandError("No such realm.")

        output_dir = options["output_dir"]
        if output_dir is None:
            output_dir = tempfile.mkdtemp(prefix="/tmp/zulip-export-")
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)
        os.makedirs(output_dir)
        do_export_realm(realm, output_dir)
        print("Written to %s" % (output_dir,))
