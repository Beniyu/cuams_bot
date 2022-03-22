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
		
		stage('Deploy to Staging Environment') {
			steps {
				sh "docker-compose up -d"
			}
		}
	}
}
		