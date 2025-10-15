# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('todo', '0006_userprofile_first_time_login'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='name_manually_edited',
            field=models.BooleanField(default=False, verbose_name='שם נערך ידנית'),
        ),
    ]
