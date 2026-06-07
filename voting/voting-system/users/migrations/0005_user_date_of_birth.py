from django.db import migrations, models

def sync_existing_users_dob(apps, schema_editor):
    User = apps.get_model("users", "User")
    for user in User.objects.all():
        if user.citizen and user.citizen.date_of_birth:
            user.date_of_birth = user.citizen.date_of_birth
        else:
            user.date_of_birth = "1990-01-01"
        user.save(update_fields=["date_of_birth"])

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_alter_user_is_eligible_alter_user_username'),
        ('citizens', '0003_citizenrecord_date_of_birth'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.RunPython(sync_existing_users_dob, migrations.RunPython.noop),
    ]
