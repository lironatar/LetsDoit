# Generated manually for Friend invitation features

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('todo', '0010_friend'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        # Add new fields to Friend model
        migrations.AddField(
            model_name='friend',
            name='friend_email',
            field=models.EmailField(blank=True, null=True, verbose_name='אימייל חבר'),
        ),
        migrations.AddField(
            model_name='friend',
            name='is_invitation',
            field=models.BooleanField(default=False, verbose_name='הזמנה'),
        ),
        migrations.AlterField(
            model_name='friend',
            name='friend',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='friend_of', to='auth.user', verbose_name='חבר'),
        ),
        
        # Create FriendInvitation model
        migrations.CreateModel(
            name='FriendInvitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('invitee_email', models.EmailField(verbose_name='אימייל מוזמן')),
                ('token', models.CharField(max_length=64, unique=True, verbose_name='טוקן')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')),
                ('is_used', models.BooleanField(default=False, verbose_name='בשימוש')),
                ('used_at', models.DateTimeField(blank=True, null=True, verbose_name='נוצל בתאריך')),
                ('inviter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_invitations', to='auth.user', verbose_name='מזמין')),
            ],
            options={
                'verbose_name': 'הזמנת חבר',
                'verbose_name_plural': 'הזמנות חברים',
                'ordering': ['-created_at'],
            },
        ),
        
        # Update unique constraints
        migrations.AlterUniqueTogether(
            name='friend',
            unique_together={('user', 'friend'), ('user', 'friend_email')},
        ),
        migrations.AlterUniqueTogether(
            name='friendinvitation',
            unique_together={('inviter', 'invitee_email')},
        ),
    ]
