# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings
import zerver.lib.str_utils


class Migration(migrations.Migration):

    dependencies = [
        ('zerver', '0026_topics_backfill'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserTopic',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('is_muted', models.BooleanField(default=False, db_index=True)),
                ('topic', models.ForeignKey(to='zerver.Topic')),
                ('user_profile', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            bases=(zerver.lib.str_utils.ModelReprMixin, models.Model),
        ),
        migrations.AlterUniqueTogether(
            name='usertopic',
            unique_together=set([('user_profile', 'topic')]),
        ),
    ]
