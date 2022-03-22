pipeline {
	agent any
	
	stages {
		stage('SCM') {
			steps { 
				script {
					checkout scm
				}
			}
		}
		
		stage('Safely Close Production Environment For Backup') {
			steps {
				sh "docker-compose down"
			}
		}
		
		stage('Database Backup') {
			steps {
				sh "docker exec MongoDB /scripts/backupDatabase.sh"
			}
		}
		
		stage('Deploy to Production Environment') {
			steps {
				sh "docker-compose build"
				sh "docker-compose up -d"
			}
		}
	}
}
		