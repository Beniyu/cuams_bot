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
		
		stage('Migrate Database') {
			steps {
				sh "npm install mongodb fs"
				sh "node ./database/migrateDatabase.js production"
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
		