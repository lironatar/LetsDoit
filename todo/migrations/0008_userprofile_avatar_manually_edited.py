# Generated migration for avatar_manually_edited field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('todo', '0007_userprofile_name_manually_edited'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='avatar_manually_edited',
            field=models.BooleanField(default=False, verbose_name='תמונת פרופיל נערכה ידנית'),
        ),
    ]

