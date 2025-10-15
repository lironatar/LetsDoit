from django.urls import path
from . import views

urlpatterns = [
    # Main views
    path('', views.index, name='index'),
    path('today/', views.today_view, name='today'),
    path('upcoming/', views.upcoming_view, name='upcoming'),
    path('inbox/', views.inbox_view, name='inbox'),
    path('project/<int:project_id>/', views.project_view, name='project'),
    path('filters/', views.filters_labels_view, name='filters'),
    path('settings/', views.settings_view, name='settings'),
    
    # API endpoints
    path('api/task/create/', views.create_task, name='create_task'),
    path('api/task/<int:task_id>/toggle/', views.toggle_task, name='toggle_task'),
    path('api/task/<int:task_id>/delete/', views.delete_task, name='delete_task'),
    path('api/project/create/', views.create_project, name='create_project'),
    path('api/project/<int:project_id>/add-member/', views.add_project_member, name='add_project_member'),
    path('api/project/<int:project_id>/remove-member/<int:user_id>/', views.remove_project_member, name='remove_project_member'),
    path('api/label/create/', views.create_label, name='create_label'),
    
    # Authentication
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
]
