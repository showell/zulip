# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import zerver.lib.str_utils


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0025_add_topic_table'),
    ]

    operations = [
        migrations.RunSQL("""
            insert into zerver_topic (recipient_id, name)
            select distinct recipient_id, subject from zerver_message where subject != ''
            """
        )
    ]
