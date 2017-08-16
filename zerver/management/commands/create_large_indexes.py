from __future__ import absolute_import
from __future__ import print_function

from typing import Any, Callable, Dict, List, Set, Text

from django.db import connection

from zerver.lib.management import ZulipBaseCommand

def create_index_if_not_exist(index_name, table_name, column_string, where_clause):
    # type: (Text, Text, Text, Text) -> None
    #
    #  This function is somewhat similar to
    #  zerver.lib.migrate.create_index_if_not_exist.
    #
    #  The other function gets used as part of Django migrations; this function
    #  uses SQL that is not supported by Django migrations.
    #
    #  Creating concurrent indexes is kind of a pain with current versions
    #  of Django/postgres, because you will get this error with seemingly
    #  reasonable code:
    #
    #    CREATE INDEX CONCURRENTLY cannot be executed from a function or multi-command string
    #
    # For a lot more detail on this process, refer to the commit message
    # that added this file to the repo.

    with connection.cursor() as cursor:
        sql = '''
            SELECT 1
            FROM pg_class
            where relname = %s
            '''
        cursor.execute(sql, [index_name])
        rows = cursor.fetchall()
        if len(rows) > 0:
            print('Index %s already exists.' % (index_name,))
            return

        sql = '''
            CREATE INDEX CONCURRENTLY
            %s
            ON %s (%s)
            %s;
            ''' % (index_name, table_name, column_string, where_clause)
        cursor.execute(sql)
        print('Finished creating %s.' % (index_name,))


def create_indexes():
    # type: () -> None

    # copied from 0082
    create_index_if_not_exist(
        index_name='zerver_usermessage_starred_message_id',
        table_name='zerver_usermessage',
        column_string='user_profile_id, message_id',
        where_clause='WHERE (flags & 2) != 0',
    )

    # copied from 0083
    create_index_if_not_exist(
        index_name='zerver_usermessage_mentioned_message_id',
        table_name='zerver_usermessage',
        column_string='user_profile_id, message_id',
        where_clause='WHERE (flags & 8) != 0',
    )

    # copied from 0095
    create_index_if_not_exist(
        index_name='zerver_usermessage_unread_message_id',
        table_name='zerver_usermessage',
        column_string='user_profile_id, message_id',
        where_clause='WHERE (flags & 1) = 0',
    )

class Command(ZulipBaseCommand):
    help = """Create concurrent indexes for large tables."""

    def handle(self, *args, **options):
        # type: (*Any, **str) -> None
        create_indexes()
