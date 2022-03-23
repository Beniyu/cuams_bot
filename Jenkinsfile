pipeline {
	agent any
	
	tools {nodejs "node"}
	
	stages {
		stage('SCM') {
			steps { 
				script {
					checkout scm
				}
			}
		}
		
		stage('SonarQube Analysis') {
			steps {
				script {
					def scannerHome = tool 'SonarScanner';
					withSonarQubeEnv() {
						sh "${scannerHome}/bin/sonar-scanner"
					}	
				}
			}
		}
		
		stage('Copy Production Database') {
			steps {
				sh "docker exec MongoDB /scripts/recreateStaging.sh"
			}
		}
		
		stage('Migrate Database')
		{
			steps {
				sh "node ./database/migrateDatabase.js staging"
			}
		}
		
		stage('Deploy to Staging Environment') {
			steps {
				sh "docker-compose build"
				sh "docker-compose up -d"
			}
		}
	}
	
}
		