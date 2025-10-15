#!/usr/bin/env python
"""
Example: Adding a New Authentication Provider

This example shows how to add support for a new authentication provider
(e.g., GitHub, Twitter, LinkedIn) using the AutoUserCreator system.
"""

import os
import sys
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
django.setup()

from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from auto_user_creation import AutoUserCreator


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def github_login(request):
    """
    Example: GitHub OAuth login endpoint
    
    This shows how to create a new authentication endpoint
    for any provider using the AutoUserCreator system.
    """
    try:
        # Get GitHub data from the request
        github_data = {
            'email': request.data.get('email'),
            'name': request.data.get('name', ''),
            'login': request.data.get('login', ''),  # GitHub username
            'avatar_url': request.data.get('avatar_url', ''),
            'id': request.data.get('id'),
        }
        
        if not github_data['email']:
            return JsonResponse({
                'success': False,
                'message': 'GitHub email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use AutoUserCreator to handle user creation/update
        creator = AutoUserCreator()
        user, created, profile, profile_created = creator.create_user_from_provider('github', github_data)
        
        # Log the user in
        from django.contrib.auth import login
        login(request, user)
        
        # Prepare response data
        response_data = {
            'success': True,
            'message': 'GitHub login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'profile': {
                    'theme': profile.theme,
                    'language': profile.language,
                    'first_time_login': profile.first_time_login,
                    'name': user.first_name or user.username,
                }
            },
            'email_verified': True,  # GitHub accounts are always verified
            'first_time_login': profile.first_time_login,
            'is_github_user': True,
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'GitHub login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def linkedin_login(request):
    """
    Example: LinkedIn OAuth login endpoint
    
    Another example showing how to add LinkedIn authentication.
    """
    try:
        # Get LinkedIn data from the request
        linkedin_data = {
            'email': request.data.get('email'),
            'firstName': request.data.get('firstName', ''),
            'lastName': request.data.get('lastName', ''),
            'profilePicture': request.data.get('profilePicture', {}).get('displayImage', ''),
            'id': request.data.get('id'),
        }
        
        if not linkedin_data['email']:
            return JsonResponse({
                'success': False,
                'message': 'LinkedIn email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use AutoUserCreator to handle user creation/update
        creator = AutoUserCreator()
        user, created, profile, profile_created = creator.create_user_from_provider('linkedin', linkedin_data)
        
        # Log the user in
        from django.contrib.auth import login
        login(request, user)
        
        # Prepare response data
        response_data = {
            'success': True,
            'message': 'LinkedIn login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'profile': {
                    'theme': profile.theme,
                    'language': profile.language,
                    'first_time_login': profile.first_time_login,
                    'name': user.first_name or user.username,
                }
            },
            'email_verified': True,  # LinkedIn accounts are always verified
            'first_time_login': profile.first_time_login,
            'is_linkedin_user': True,
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'LinkedIn login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def add_custom_provider_support():
    """
    Example: How to add support for a custom provider
    
    To add support for a new provider, you need to:
    1. Add a new method to AutoUserCreator class
    2. Update the _extract_user_data method
    3. Create a new API endpoint
    """
    
    class CustomAutoUserCreator(AutoUserCreator):
        """Extended AutoUserCreator with custom provider support"""
        
        def _extract_custom_data(self, provider_data, email):
            """Extract user data from custom provider response"""
            name = provider_data.get('displayName', '')
            picture = provider_data.get('photoURL', '')
            
            if name:
                name_parts = name.strip().split()
                first_name = name_parts[0] if name_parts else ''
                last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            else:
                username_part = email.split('@')[0]
                first_name = username_part
                last_name = ''
            
            return {
                'email': email,
                'username': email,
                'first_name': first_name,
                'last_name': last_name,
                'picture': picture,
                'is_active': True,
            }
        
        def _extract_user_data(self, provider_data):
            """Override to add custom provider support"""
            email = provider_data.get('email', '').strip().lower()
            
            if not email:
                raise ValueError("Email is required for user creation")
            
            if self.provider == 'custom':
                return self._extract_custom_data(provider_data, email)
            else:
                # Call parent method for existing providers
                return super()._extract_user_data(provider_data)
    
    return CustomAutoUserCreator


if __name__ == "__main__":
    print("📚 Example: Adding New Authentication Providers")
    print("=" * 60)
    
    print("\n1. GitHub Login Endpoint:")
    print("   - Extracts: email, name, login, avatar_url, id")
    print("   - Uses AutoUserCreator with provider='github'")
    print("   - Returns standardized response format")
    
    print("\n2. LinkedIn Login Endpoint:")
    print("   - Extracts: email, firstName, lastName, profilePicture, id")
    print("   - Uses AutoUserCreator with provider='linkedin'")
    print("   - Returns standardized response format")
    
    print("\n3. Custom Provider Support:")
    print("   - Extend AutoUserCreator class")
    print("   - Add custom data extraction method")
    print("   - Override _extract_user_data method")
    
    print("\n✅ To add a new provider:")
    print("   1. Create a new API endpoint (like github_login)")
    print("   2. Extract provider-specific data from request")
    print("   3. Call AutoUserCreator with provider name")
    print("   4. Return standardized response")
    
    print("\n🎯 Benefits of this approach:")
    print("   - Consistent user creation across all providers")
    print("   - Automatic friend invitation handling")
    print("   - Default data seeding for new users")
    print("   - Profile management and avatar updates")
    print("   - Easy to extend for new providers")
