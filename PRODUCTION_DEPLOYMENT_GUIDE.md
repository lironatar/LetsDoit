# TodoFast Production Deployment Guide

## Overview
This guide will help you deploy TodoFast in a production environment on Windows while maintaining the current SQLite setup.

## Prerequisites
- Windows 10/11
- Python 3.8+
- Node.js 16+
- Git

## Production Deployment Steps

### 1. Environment Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd ToDoFast2
   ```

2. **Create production environment file**:
   ```bash
   copy .env.production .env
   ```

3. **Edit `.env` file** with your production settings:
   - Generate a new `SECRET_KEY` (use Django's get_random_secret_key())
   - Set `DEBUG=False`
   - Update `ALLOWED_HOSTS` with your domain/IP
   - Configure email settings
   - Set up Google OAuth credentials

### 2. Installation and Build

1. **Run the deployment script**:
   ```bash
   deploy-prod.bat
   ```

   This script will:
   - Set up Python virtual environment
   - Install dependencies
   - Run database migrations
   - Build frontend for production
   - Collect static files

### 3. Production Server Start

1. **Check production status** (optional):
   ```bash
   check-prod-status.bat
   ```

2. **Start the production server**:
   ```bash
   start-prod.bat
   ```

## Security Configuration

### Environment Variables (.env)
```env
# Essential Production Settings
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# HTTPS Security (when SSL is configured)
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
```

### Database Security
- SQLite database file permissions should be restricted
- Regular backups recommended
- Consider database encryption for sensitive data

## Performance Optimizations

### Implemented Features
- **Static File Compression**: WhiteNoise with compression
- **Frontend Optimization**: Code splitting, minification
- **Caching**: Local memory cache for frequently accessed data
- **Database Optimization**: Connection timeouts and threading settings

### Monitoring and Logging
- Logs stored in `logs/` directory
- Separate error and access logs
- Configurable log levels via environment variables

## Maintenance Tasks

### Regular Backups
```bash
# Backup database
copy db.sqlite3 backups\db_backup_%date%.sqlite3

# Backup media files
xcopy /E /I media backups\media_%date%\
```

### Log Rotation
```bash
# Archive old logs (manual process)
move logs\django.log logs\django_%date%.log
move logs\errors.log logs\errors_%date%.log
```

## Troubleshooting

### Common Issues

1. **Static files not loading**:
   - Run: `python manage.py collectstatic --noinput`
   - Check STATIC_ROOT and STATICFILES_DIRS settings

2. **Frontend not updating**:
   - Rebuild frontend: `cd frontend && npm run build:prod`
   - Clear browser cache

3. **Database locked errors**:
   - Check file permissions on db.sqlite3
   - Ensure proper database timeout settings

4. **Permission errors**:
   - Run command prompt as Administrator
   - Check file/folder permissions

### Log Analysis
```bash
# View recent errors
type logs\errors.log | findstr /C:"ERROR"

# Monitor access patterns  
type logs\access.log | findstr /C:"POST"
```

## Security Checklist

- [ ] DEBUG=False in production
- [ ] Secure SECRET_KEY generated
- [ ] ALLOWED_HOSTS properly configured
- [ ] SSL/HTTPS configured (recommended)
- [ ] Email credentials secured
- [ ] Google OAuth credentials updated
- [ ] Database file permissions restricted
- [ ] Regular security updates applied
- [ ] Backup strategy implemented

## Performance Monitoring

### Key Metrics to Monitor
- Response times
- Error rates (check error logs)
- Database query performance
- Static file serving efficiency
- Memory usage

### Tools and Commands
```bash
# Check server status
tasklist | findstr python

# Monitor log files
powershell Get-Content logs\django.log -Wait -Tail 50

# Check disk space
dir /s
```

## Scaling Considerations

When you need to scale beyond the current setup:

1. **Database**: Migrate to PostgreSQL
2. **Static Files**: Use CDN (CloudFront, Cloudflare)
3. **Load Balancing**: Multiple server instances
4. **Containerization**: Docker deployment
5. **Cloud Hosting**: AWS, Azure, or Google Cloud

## Support and Maintenance

### Regular Tasks
- Monitor error logs daily
- Update dependencies monthly
- Backup database weekly
- Review security settings quarterly

### Emergency Procedures
1. **Server Down**: Check logs, restart with `start-prod.bat`
2. **Database Issues**: Restore from backup
3. **Security Breach**: Change SECRET_KEY, review access logs
4. **Performance Issues**: Check logs, restart server

---

For additional help, check the Django documentation or create an issue in the project repository.
